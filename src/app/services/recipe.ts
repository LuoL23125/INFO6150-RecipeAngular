import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private apiKey = 'a7585a8f408c45b8b7f6627145388a33'; 
  private baseUrl = 'https://api.spoonacular.com/recipes';
  private localUrl = 'http://localhost:3000/cachedRecipes';
  private customUrl = 'http://localhost:3000/customRecipes';
  
  private http = inject(HttpClient);

  // === 现有方法保持不变 ===
  getRandomRecipe(): Observable<any> {
    return this.http.get(`${this.baseUrl}/random?number=1&apiKey=${this.apiKey}`);
  }

  getRecipes(query: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/complexSearch?query=${query}&number=12&addRecipeInformation=true&apiKey=${this.apiKey}`);
  }

  searchLocalRecipes(query: string): Observable<any> {
    return this.getLocalRecipes().pipe(
      map(recipes => recipes.filter((r: any) => r.title.toLowerCase().includes(query.toLowerCase())))
    );
  }

  getRecipeById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}/information?apiKey=${this.apiKey}`);
  }

  getLocalRecipeById(id: string): Observable<any> {
    return this.http.get<any[]>(this.localUrl).pipe(
      map(recipes => recipes.find(r => r.id == id))
    );
  }
  
  getCustomRecipeById(id: string): Observable<any> {
    return this.http.get<any[]>(this.customUrl).pipe(
      map(recipes => recipes.find(r => r.id == id))
    );
  }

  saveRecipeToLocal(recipe: any) {
    return this.http.post(this.localUrl, recipe);
  }

  getLocalRecipes(): Observable<any> {
    return this.http.get<any[]>(this.localUrl);
  }

  addCustomRecipe(recipe: any): Observable<any> {
    return this.http.post(this.customUrl, recipe);
  }

  getUserCustomRecipes(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.customUrl}?userId=${userId}`);
  }

  updateCustomRecipe(id: string, recipe: any): Observable<any> {
    return this.http.put(`${this.customUrl}/${id}`, recipe);
  }

  deleteCustomRecipe(id: string): Observable<any> {
    return this.http.delete(`${this.customUrl}/${id}`);
  }

  // === 新增：高级搜索 (Advanced Search) ===

  // 1. 远程 API 搜索
  complexSearchRemote(filters: any): Observable<any> {
    let url = `${this.baseUrl}/complexSearch?apiKey=${this.apiKey}&number=12&addRecipeInformation=true`;

    if (filters.query) url += `&query=${filters.query}`;
    
    // Diet: 逗号分隔 (e.g. "vegetarian,gluten free")
    if (filters.diets && filters.diets.length > 0) {
      url += `&diet=${filters.diets.join(',')}`;
    }
    
    // Intolerances: 逗号分隔 (e.g. "peanut,dairy")
    if (filters.intolerances && filters.intolerances.length > 0) {
      url += `&intolerances=${filters.intolerances.join(',')}`;
    }

    // Ingredients: 逗号分隔 (e.g. "chicken,tomato")
    if (filters.ingredients) {
      url += `&includeIngredients=${filters.ingredients}`;
    }

    return this.http.get(url);
  }

  // 2. 本地高级搜索 (Fallback)
  // 获取 cachedRecipes 和 customRecipes，然后在内存中过滤
  complexSearchLocal(filters: any): Observable<any[]> {
    return forkJoin([
      this.http.get<any[]>(this.localUrl),
      this.http.get<any[]>(this.customUrl)
    ]).pipe(
      map(([cached, custom]) => {
        // 合并所有本地数据
        const allRecipes = [...cached, ...custom];
        return this.filterRecipes(allRecipes, filters);
      })
    );
  }

  // 3. 核心过滤逻辑 (纯 JS 实现，模仿 API 行为)
  private filterRecipes(recipes: any[], filters: any): any[] {
    return recipes.filter(r => {
      // A. 关键词匹配
      if (filters.query && !r.title.toLowerCase().includes(filters.query.toLowerCase())) {
        return false;
      }

      // B. Diet 匹配 (Vegetarian, Vegan, Gluten Free 等)
      // Spoonacular 数据里有 boolean 字段: vegetarian, vegan, glutenFree
      if (filters.diets && filters.diets.length > 0) {
        for (const diet of filters.diets) {
          const d = diet.toLowerCase();
          if (d === 'vegetarian' && !r.vegetarian) return false;
          if (d === 'vegan' && !r.vegan) return false;
          if (d === 'gluten free' && !r.glutenFree) return false;
          // Ketogenic 等其他 diet 在本地数据里可能没有字段，这里做简单处理
        }
      }

      // C. Intolerance 匹配
      // 如果选了 Dairy 不耐受 -> 要求 dairyFree 为 true
      if (filters.intolerances && filters.intolerances.length > 0) {
        for (const intel of filters.intolerances) {
          const i = intel.toLowerCase();
          if (i === 'dairy' && !r.dairyFree) return false;
          if (i === 'gluten' && !r.glutenFree) return false;
          // 其他 intolerance 本地可能无法准确判断，暂且放过或严格过滤
        }
      }

      // D. Ingredient 匹配
      if (filters.ingredients) {
        const requiredIngredients = filters.ingredients.split(',').map((i: string) => i.trim().toLowerCase());
        
        // 获取该食谱的所有原料名称
        let recipeIngredients: string[] = [];
        
        // API 格式
        if (r.extendedIngredients) {
          recipeIngredients = r.extendedIngredients.map((i: any) => i.name.toLowerCase());
        } 
        // Custom 格式
        else if (r.ingredients) {
          recipeIngredients = r.ingredients.map((i: string) => i.toLowerCase());
        }

        // 检查是否包含所有要求的原料
        const hasAll = requiredIngredients.every((req: string) => 
          recipeIngredients.some(ing => ing.includes(req))
        );
        if (!hasAll) return false;
      }

      return true;
    });
  }
}