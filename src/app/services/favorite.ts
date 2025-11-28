import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, switchMap, tap, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/favorites';

  favoriteIds = signal<Set<string | number>>(new Set());

  // 1. 加载 ID 集合 (用于判断爱心状态)
  loadFavorites(userId: string) {
    return this.http.get<any[]>(`${this.apiUrl}?userId=${userId}`).pipe(
      tap(favorites => {
        const ids = new Set(favorites.map(f => f.recipeId));
        this.favoriteIds.set(ids);
      })
    );
  }

  // === 新增：获取完整的收藏列表 (用于 Profile 展示) ===
  getUserFavorites(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?userId=${userId}`);
  }

  clearFavorites() {
    this.favoriteIds.set(new Set());
  }

  isFavorite(recipeId: string | number): boolean {
    return this.favoriteIds().has(recipeId);
  }

  toggleFavorite(userId: string, recipe: any) {
    const isFav = this.isFavorite(recipe.id);
    if (isFav) return this.removeFavorite(userId, recipe.id);
    else return this.addFavorite(userId, recipe);
  }

  private addFavorite(userId: string, recipe: any) {
    const newFavorite = {
      userId: userId,
      recipeId: recipe.id,
      title: recipe.title,
      image: recipe.image,
      readyInMinutes: recipe.readyInMinutes,
      servings: recipe.servings,
      summary: recipe.summary,
      addedAt: new Date().toISOString()
    };
    return this.http.post(this.apiUrl, newFavorite).pipe(
      tap(() => this.favoriteIds.update(ids => {
        const newIds = new Set(ids);
        newIds.add(recipe.id);
        return newIds;
      }))
    );
  }

  private removeFavorite(userId: string, recipeId: string | number) {
    return this.http.get<any[]>(`${this.apiUrl}?userId=${userId}&recipeId=${recipeId}`).pipe(
      switchMap(items => {
        if (items.length > 0) return this.http.delete(`${this.apiUrl}/${items[0].id}`);
        throw new Error('Favorite not found');
      }),
      tap(() => this.favoriteIds.update(ids => {
        const newIds = new Set(ids);
        newIds.delete(recipeId);
        return newIds;
      }))
    );
  }
}