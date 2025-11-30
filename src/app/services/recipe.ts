import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private apiKey = 'b5f2d96206764b048d012605b2abb365'; 
  private baseUrl = 'https://api.spoonacular.com/recipes';
  private localUrl = 'http://localhost:3000/cachedRecipes';
  private customUrl = 'http://localhost:3000/customRecipes';
  private mealPlanUrl = 'https://api.spoonacular.com/mealplanner/generate'; // Spoonacular Generator
  private plansUrl = 'http://localhost:3000/mealPlans'; // JSON Server for meal plans
  
  private http = inject(HttpClient);

  // === Standard API Methods ===
  getRandomRecipe(): Observable<any> {
    return this.http.get(`${this.baseUrl}/random?number=1&includeNutrition=true&apiKey=${this.apiKey}`);
  }

  getRecipes(query: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/complexSearch?query=${query}&number=12&addRecipeInformation=true&addRecipeNutrition=true&apiKey=${this.apiKey}`);
  }

  searchLocalRecipes(query: string): Observable<any> {
    return this.getLocalRecipes().pipe(
      map(recipes => recipes.filter((r: any) => r.title.toLowerCase().includes(query.toLowerCase())))
    );
  }

  getRecipeById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}/information?includeNutrition=true&apiKey=${this.apiKey}`);
  }

  getLocalRecipeById(id: string): Observable<any> {
    return this.http.get<any[]>(this.localUrl).pipe(map(recipes => recipes.find(r => r.id == id)));
  }
  
  getCustomRecipeById(id: string): Observable<any> {
    return this.http.get<any[]>(this.customUrl).pipe(map(recipes => recipes.find(r => r.id == id)));
  }

  saveRecipeToLocal(recipe: any) { return this.http.post(this.localUrl, recipe); }
  getLocalRecipes(): Observable<any> { return this.http.get(this.localUrl); }
  addCustomRecipe(recipe: any): Observable<any> { return this.http.post(this.customUrl, recipe); }
  getUserCustomRecipes(userId: string): Observable<any[]> { return this.http.get<any[]>(`${this.customUrl}?userId=${userId}`); }
  updateCustomRecipe(id: string, recipe: any): Observable<any> { return this.http.put(`${this.customUrl}/${id}`, recipe); }
  deleteCustomRecipe(id: string): Observable<any> { return this.http.delete(`${this.customUrl}/${id}`); }

  // === Advanced Search Remote (API) ===
  complexSearchRemote(filters: any): Observable<any> {
    let url = `${this.baseUrl}/complexSearch?apiKey=${this.apiKey}&number=12&addRecipeInformation=true&addRecipeNutrition=true`;
    
    if (filters.query) url += `&query=${filters.query}`;
    
    // API 接受逗号分隔的字符串
    if (filters.diets && filters.diets.length > 0) {
      url += `&diet=${filters.diets.join(',')}`;
    }
    
    if (filters.intolerances && filters.intolerances.length > 0) {
      url += `&intolerances=${filters.intolerances.join(',')}`;
    }

    if (filters.ingredients) {
      url += `&includeIngredients=${filters.ingredients}`;
    }

    return this.http.get(url);
  }

  // === Advanced Search Local (Fallback Logic) ===
  complexSearchLocal(filters: any): Observable<any[]> {
    return forkJoin([
      this.http.get<any[]>(this.localUrl),
      this.http.get<any[]>(this.customUrl)
    ]).pipe(
      map(([cached, custom]) => {
        const allRecipes = [...cached, ...custom];
        return this.filterRecipes(allRecipes, filters);
      })
    );
  }

  // === 本地智能过滤核心 ===
  private filterRecipes(recipes: any[], filters: any): any[] {
    return recipes.filter(r => {
      // 1. 关键词过滤
      if (filters.query && !r.title.toLowerCase().includes(filters.query.toLowerCase())) {
        return false;
      }

      // 2. Diet 过滤
      if (filters.diets && filters.diets.length > 0) {
        for (const diet of filters.diets) {
          const d = diet.toLowerCase();
          
          // A. 检查标准布尔值字段 (Vegetarian, Vegan, GlutenFree, DairyFree)
          if (d === 'vegetarian' && !r.vegetarian) return false;
          if (d === 'vegan' && !r.vegan) return false;
          if (d === 'gluten free' && !r.glutenFree) return false;
          if (d === 'dairy free' && !r.dairyFree) return false;

          // B. 检查 diets 数组 (Ketogenic, Paleo, Whole30 等可能存在于 tags 或 diets 数组中)
          // 只要用户选了这些特殊饮食，如果本地数据的 diets 数组里没有这个词，就排除
          if (['ketogenic', 'paleo', 'primal', 'whole30', 'pescetarian'].includes(d)) {
             // 如果本地数据压根没 diets 数组，或者数组里没这个词 -> 排除
             if (!r.diets || !r.diets.some((tag: string) => tag.toLowerCase() === d)) {
               return false;
             }
          }
        }
      }

      // 3. Intolerance 过滤 (过敏源检查)
      if (filters.intolerances && filters.intolerances.length > 0) {
        // 准备原料字符串：将所有原料名称拼成一个长字符串，方便检查
        let allIngredientsStr = '';
        if (r.extendedIngredients) {
          allIngredientsStr = r.extendedIngredients.map((i: any) => i.name).join(' ').toLowerCase();
        } else if (r.ingredients) {
          allIngredientsStr = r.ingredients.join(' ').toLowerCase();
        }

        for (const intel of filters.intolerances) {
          const i = intel.toLowerCase();
          
          // A. 显式字段检查
          if (i === 'dairy' && !r.dairyFree) return false;
          if (i === 'gluten' && !r.glutenFree) return false;

          // B. 原料扫描 (针对 Peanut, Soy, Egg, Shellfish 等)
          // 如果用户不耐受 Peanut，但原料里写了 "peanut butter"，则排除
          if (allIngredientsStr.includes(i)) {
            return false;
          }
        }
      }

      // 4. Ingredients 包含过滤 (必须包含用户输入的所有原料)
      if (filters.ingredients) {
        const requiredIngredients = filters.ingredients.split(',').map((i: string) => i.trim().toLowerCase());
        let recipeIngredients: string[] = [];
        
        if (r.extendedIngredients) {
          recipeIngredients = r.extendedIngredients.map((i: any) => i.name.toLowerCase());
        } else if (r.ingredients) {
          recipeIngredients = r.ingredients.map((i: string) => i.toLowerCase());
        }

        const hasAll = requiredIngredients.every((req: string) => 
          recipeIngredients.some(ing => ing.includes(req))
        );
        if (!hasAll) return false;
      }

      return true;
    });
  }

// === Updated Meal Planner Logic ===

  // 1. 生成周计划 (新增 exclude 参数)
  generateWeeklyPlan(targetCalories: number, diet: string, exclude: string): Observable<any> {
    let url = `${this.mealPlanUrl}?timeFrame=week&targetCalories=${targetCalories}&apiKey=${this.apiKey}`;
    if (diet) {
      url += `&diet=${diet}`;
    }
    // Spoonacular 参数是 'exclude' (Comma separated list of allergens or ingredients)
    if (exclude) {
      url += `&exclude=${exclude}`;
    }
    return this.http.get(url);
  }

  saveMealPlan(plan: any): Observable<any> {
    return this.http.post(this.plansUrl, plan);
  }

  getUserMealPlans(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.plansUrl}?userId=${userId}`);
  }

  // 新增：删除计划
  deleteMealPlan(id: string): Observable<any> {
    return this.http.delete(`${this.plansUrl}/${id}`);
  }
}