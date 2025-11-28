import { Component, Input, Output, EventEmitter, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { FavoriteService } from '../services/favorite';
import { RecipeService } from '../services/recipe';

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
  
  @Output() recipeDeleted = new EventEmitter<string>();

  private authService = inject(AuthService);
  private favoriteService = inject(FavoriteService);
  private recipeService = inject(RecipeService);
  private router = inject(Router);

  isFavorite = computed(() => {
    return this.favoriteService.isFavorite(this.recipe.id);
  });

  get isOwner(): boolean {
    const user = this.authService.currentUser();
    return user && this.recipe.userId && String(this.recipe.userId) === String(user.id);
  }

  // === 新增：计算详情页的链接 ===
  get detailLink(): any[] {
    // 我们的逻辑：只有自定义食谱才有 'userId' 字段
    // 如果是自定义食谱，ID 前面加 'custom-'
    if (this.recipe.userId) {
      return ['/recipe', `custom-${this.recipe.id}`];
    }
    // 如果是 API 食谱，直接用 ID
    return ['/recipe', this.recipe.id];
  }

  onFavoriteClick(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    this.favoriteService.toggleFavorite(user.id, this.recipe).subscribe();
  }

  onEdit(event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.router.navigate(['/edit-recipe', this.recipe.id]);
  }

  onDelete(event: Event) {
    event.stopPropagation();
    event.preventDefault();

    if (confirm('Are you sure you want to delete this recipe?')) {
      this.recipeService.deleteCustomRecipe(this.recipe.id).subscribe({
        next: () => {
          this.recipeDeleted.emit(this.recipe.id);
        },
        error: (err) => alert('Failed to delete recipe')
      });
    }
  }
}