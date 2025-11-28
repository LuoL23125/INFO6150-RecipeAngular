import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  // 你的 API Key (哪怕失效了也没关系，我们会处理失败情况)
  private apiKey = 'a7585a8f408c45b8b7f6627145388a33'; //a7585a8f408c45b8b7f6627145388a33
  private baseUrl = 'https://api.spoonacular.com/recipes';
  private localUrl = 'http://localhost:3000/cachedRecipes';
  
  private http = inject(HttpClient);

  // 1. 随机 (API)
  getRandomRecipe(): Observable<any> {
    return this.http.get(`${this.baseUrl}/random?number=1&apiKey=${this.apiKey}`);
  }

  // 2. 搜索 (API)
  getRecipes(query: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/complexSearch?query=${query}&number=12&addRecipeInformation=true&apiKey=${this.apiKey}`);
  }

  // 3. 新增：本地搜索 (JSON Server)
  // json-server 的魔法：?q=term 会进行全文模糊搜索
  searchLocalRecipes(query: string): Observable<any> {
    return this.http.get(`${this.localUrl}?q=${query}`);
  }

  // 4. ID 获取 (API)
  getRecipeById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}/information?apiKey=${this.apiKey}`);
  }

  // 5. 本地 ID 获取
  getLocalRecipeById(id: string): Observable<any> {
    return this.http.get<any[]>(this.localUrl).pipe(
      map(recipes => recipes.find(r => r.id == id))
    );
  }

  // 6. 保存
  saveRecipeToLocal(recipe: any) {
    return this.http.post(this.localUrl, recipe);
  }

  // 7. 获取所有本地
  getLocalRecipes(): Observable<any> {
    return this.http.get(this.localUrl);
  }
}