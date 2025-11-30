import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, tap, forkJoin, switchMap, of } from 'rxjs'; // <--- 引入 forkJoin, switchMap, of
import { FavoriteService } from './favorite';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private favoriteService = inject(FavoriteService);
  
  private apiUrl = 'http://localhost:3000/users';
  // 定义其他资源的 URL 根路径，用于级联删除
  private baseUrl = 'http://localhost:3000';

  currentUser = signal<any>(this.getUserFromStorage());
  isAdmin = computed(() => !!this.currentUser()?.isAdmin);

  constructor() {
    const user = this.currentUser();
    if (user) {
      this.favoriteService.loadFavorites(user.id).subscribe();
    }
  }

  // === Admin Features ===

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // 1. 修改用户角色 (Promote/Demote)
  updateUserRole(userId: string, isAdmin: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${userId}`, { isAdmin });
  }

  // 2. 删除用户及其所有关联数据 (Cascade Delete)
  deleteUserAndData(userId: string): Observable<any> {
    // 定义一个辅助函数：删除某个集合中属于该用户的所有条目
    const deleteCollection = (collectionName: string) => {
      return this.http.get<any[]>(`${this.baseUrl}/${collectionName}?userId=${userId}`).pipe(
        switchMap(items => {
          if (items.length === 0) return of([]); // 如果没数据，直接返回
          // 并行发送 N 个删除请求
          const deleteRequests = items.map(item => 
            this.http.delete(`${this.baseUrl}/${collectionName}/${item.id}`)
          );
          return forkJoin(deleteRequests);
        })
      );
    };

    // 1. 并行清理所有关联数据
    return forkJoin([
      deleteCollection('favorites'),
      deleteCollection('reviews'),
      deleteCollection('mealPlans'),
      deleteCollection('customRecipes')
    ]).pipe(
      // 2. 数据清理完毕后，删除用户本身
      switchMap(() => {
        return this.http.delete(`${this.apiUrl}/${userId}`);
      })
    );
  }

  // === Regular Features ===

  register(userData: any): Observable<any> {
    const newUser = {
      ...userData,
      name: `${userData.firstName} ${userData.lastName}`,
      password: btoa(userData.password),
      isAdmin: false,
      createdAt: new Date().toISOString()
    };

    return this.http.post(this.apiUrl, newUser).pipe(
      tap((user) => this.loginSuccess(user))
    );
  }

  login(email: string, passwordRaw: string): Observable<boolean> {
    return this.http.get<any[]>(`${this.apiUrl}?email=${email}`).pipe(
      map(users => {
        if (users.length === 0) return false;
        
        const user = users[0];
        const encodedPassword = btoa(passwordRaw);
        
        if (user.password === encodedPassword) {
          this.loginSuccess(user);
          return true;
        }
        return false;
      })
    );
  }

  updateProfile(userId: string, data: any): Observable<any> {
    if (data.password) {
      data.password = btoa(data.password);
    }
    return this.http.patch(`${this.apiUrl}/${userId}`, data).pipe(
      tap((updatedUser) => {
        // 如果是更新自己，同步刷新本地状态
        if (this.currentUser()?.id === userId) {
          this.loginSuccess(updatedUser);
        }
      })
    );
  }

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem('user');
    this.favoriteService.clearFavorites();
    this.router.navigate(['/']);
  }

  private loginSuccess(user: any) {
    this.currentUser.set(user);
    localStorage.setItem('user', JSON.stringify(user));
    if (user.id) {
        this.favoriteService.loadFavorites(user.id).subscribe();
    }
  }

  private getUserFromStorage() {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }
}