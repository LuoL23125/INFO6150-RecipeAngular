import { Component, Input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth';     // <--- 引入
import { FavoriteService } from '../services/favorite'; // <--- 引入

@Component({
  selector: 'app-recipe-card',
  standalone: true,
  imports: [CommonModule, RouterModule], 
  templateUrl: './recipe-card.html',
  styleUrls: ['./recipe-card.css']
})
export class RecipeCard {
  @Input() recipe!: any;
  @Input() isHero: boolean = false;

  private authService = inject(AuthService);
  private favoriteService = inject(FavoriteService);
  private router = inject(Router);

  // 使用 computed 属性：每当 favoriteService 的信号变化，这里自动更新
  // 这样红心状态是完全响应式的
  isFavorite = computed(() => {
    return this.favoriteService.isFavorite(this.recipe.id);
  });

  onFavoriteClick(event: Event) {
    event.stopPropagation(); // 防止触发 View Recipe 跳转
    event.preventDefault();

    const user = this.authService.currentUser();

    // 1. 如果是游客 -> 跳转登录
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    // 2. 如果已登录 -> 切换收藏
    this.favoriteService.toggleFavorite(user.id, this.recipe).subscribe({
      next: () => console.log('Favorite updated'),
      error: (err) => console.error('Favorite failed', err)
    });
  }
}