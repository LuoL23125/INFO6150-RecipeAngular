import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { FavoriteService } from './favorite'; // <--- 引入

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private favoriteService = inject(FavoriteService); // <--- 注入
  
  private apiUrl = 'http://localhost:3000/users';

  // 尝试初始化时如果有用户，也加载收藏
  currentUser = signal<any>(this.getUserFromStorage());

  constructor() {
    // 如果刷新页面时用户已登录，重新加载他的收藏列表
    const user = this.currentUser();
    if (user) {
      this.favoriteService.loadFavorites(user.id).subscribe();
    }
  }

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

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem('user');
    this.favoriteService.clearFavorites(); // <--- 清空收藏状态
    this.router.navigate(['/']);
  }

  private loginSuccess(user: any) {
    this.currentUser.set(user);
    localStorage.setItem('user', JSON.stringify(user));
    
    // 登录成功后：加载该用户的收藏夹
    this.favoriteService.loadFavorites(user.id).subscribe();
    
    // (可选) 如果你有合并逻辑，可以在这里调用 mergeLocalFavorites
  }

  private getUserFromStorage() {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }
}