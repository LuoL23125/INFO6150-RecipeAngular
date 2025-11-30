import { Injectable, inject, signal, computed } from '@angular/core'; // <--- 引入 computed
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { FavoriteService } from './favorite';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private favoriteService = inject(FavoriteService);
  
  private apiUrl = 'http://localhost:3000/users';

  currentUser = signal<any>(this.getUserFromStorage());

  // === 新增：计算属性，实时判断是否为管理员 ===
  isAdmin = computed(() => !!this.currentUser()?.isAdmin);

  constructor() {
    const user = this.currentUser();
    if (user) {
      this.favoriteService.loadFavorites(user.id).subscribe();
    }
  }

  // === 新增：获取所有用户 (供 Admin Dashboard 使用) ===
  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  register(userData: any): Observable<any> {
    const newUser = {
      ...userData,
      name: `${userData.firstName} ${userData.lastName}`,
      password: btoa(userData.password),
      isAdmin: false, // 默认注册的都不是管理员
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
        this.loginSuccess(updatedUser);
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