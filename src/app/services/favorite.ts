import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, switchMap, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/favorites';

  // 使用 Set 来存储当前用户收藏的 Recipe ID，查询速度极快 O(1)
  // 使用 Signal 让 UI 可以响应式更新
  favoriteIds = signal<Set<string | number>>(new Set());

  // 1. 加载当前用户的收藏列表 (登录后调用)
  loadFavorites(userId: string) {
    return this.http.get<any[]>(`${this.apiUrl}?userId=${userId}`).pipe(
      tap(favorites => {
        const ids = new Set(favorites.map(f => f.recipeId));
        this.favoriteIds.set(ids);
      })
    );
  }

  // 2. 清空收藏状态 (登出时调用)
  clearFavorites() {
    this.favoriteIds.set(new Set());
  }

  // 3. 检查某个食谱是否已收藏
  isFavorite(recipeId: string | number): boolean {
    return this.favoriteIds().has(recipeId);
  }

  // 4. 切换收藏状态 (Add / Remove)
  toggleFavorite(userId: string, recipe: any) {
    // 我们的 ID 可能是数字也可能是字符串，统一比较
    const isFav = this.isFavorite(recipe.id);

    if (isFav) {
      return this.removeFavorite(userId, recipe.id);
    } else {
      return this.addFavorite(userId, recipe);
    }
  }

  private addFavorite(userId: string, recipe: any) {
    // 构造符合你 db.json 结构的数据
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
      tap(() => {
        // 更新本地 Signal 状态 (立刻变红心)
        this.favoriteIds.update(ids => {
          const newIds = new Set(ids);
          newIds.add(recipe.id);
          return newIds;
        });
      })
    );
  }

  private removeFavorite(userId: string, recipeId: string | number) {
    // json-server 删除需要通过唯一的 id (不是 recipeId)
    // 所以我们需要先找到那个收藏条目的 id
    return this.http.get<any[]>(`${this.apiUrl}?userId=${userId}&recipeId=${recipeId}`).pipe(
      switchMap(items => {
        if (items.length > 0) {
          const idToDelete = items[0].id;
          return this.http.delete(`${this.apiUrl}/${idToDelete}`);
        }
        throw new Error('Favorite not found');
      }),
      tap(() => {
        // 更新本地 Signal 状态 (立刻变空心)
        this.favoriteIds.update(ids => {
          const newIds = new Set(ids);
          newIds.delete(recipeId);
          return newIds;
        });
      })
    );
  }

  // 5. 合并 LocalStorage (如果在游客模式下有允许收藏的功能)
  // 虽然我们现在的逻辑是游客点爱心直接跳登录，但保留这个接口以防万一
  mergeLocalFavorites(userId: string) {
    const local = localStorage.getItem('local_favorites');
    if (local) {
      const localRecipes = JSON.parse(local);
      // 使用 forkJoin 并行处理所有添加请求
      const requests = localRecipes.map((r: any) => this.addFavorite(userId, r));
      
      return forkJoin(requests).pipe(
        tap(() => localStorage.removeItem('local_favorites'))
      );
    }
    return null;
  }
}