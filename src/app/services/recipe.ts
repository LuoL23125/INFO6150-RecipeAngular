import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private apiKey = 'a7585a8f408c45b8b7f6627145388a33'; 
  private baseUrl = 'https://api.spoonacular.com/recipes';
  private localUrl = 'http://localhost:3000/cachedRecipes';
  private customUrl = 'http://localhost:3000/customRecipes';
  
  private http = inject(HttpClient);

  // === 1. Spoonacular API ===
  getRandomRecipe(): Observable<any> {
    return this.http.get(`${this.baseUrl}/random?number=1&apiKey=${this.apiKey}`);
  }

  getRecipes(query: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/complexSearch?query=${query}&number=12&addRecipeInformation=true&apiKey=${this.apiKey}`);
  }

  searchLocalRecipes(query: string): Observable<any> {
    return this.http.get(`${this.localUrl}?q=${query}`);
  }

  getRecipeById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}/information?apiKey=${this.apiKey}`);
  }

  // === 2. 本地缓存 ===
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
    return this.http.get(this.localUrl);
  }

  // === 3. 自定义食谱 CRUD ===
  
  // Create
  addCustomRecipe(recipe: any): Observable<any> {
    return this.http.post(this.customUrl, recipe);
  }

  // Read (User's recipes)
  getUserCustomRecipes(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.customUrl}?userId=${userId}`);
  }

  // Update (新增)
  updateCustomRecipe(id: string, recipe: any): Observable<any> {
    return this.http.put(`${this.customUrl}/${id}`, recipe);
  }

  // Delete (新增)
  deleteCustomRecipe(id: string): Observable<any> {
    return this.http.delete(`${this.customUrl}/${id}`);
  }
}