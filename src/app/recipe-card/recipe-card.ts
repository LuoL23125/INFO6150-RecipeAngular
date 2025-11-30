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

  // 控制分享成功的视觉反馈
  isCopied = false;

  isFavorite = computed(() => {
    return this.favoriteService.isFavorite(this.recipe.id);
  });

  // === 修改重点：更精准的权限判断 ===
  get isOwner(): boolean {
    const user = this.authService.currentUser();
    
    // 条件1: 用户必须登录
    // 条件2: userId 必须匹配
    // 条件3 (关键): recipeId 必须不存在！
    // 因为收藏夹里的条目也有 userId，但它们有 recipeId 指向原数据。
    // 只有"原始自定义食谱"才没有 recipeId。
    return user && 
           this.recipe.userId && 
           String(this.recipe.userId) === String(user.id) &&
           !this.recipe.recipeId; 
  }

  get detailLink(): any[] {
    if (this.recipe.userId && !this.recipe.recipeId) {
      return ['/recipe', `custom-${this.recipe.id}`];
    }
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

  // 分享功能
  async onShare(event: Event) {
    event.stopPropagation();
    event.preventDefault();

    const urlTree = this.router.createUrlTree(this.detailLink);
    const fullUrl = window.location.origin + urlTree.toString();
    const shareData = {
      title: this.recipe.title || 'Delicious Recipe',
      text: `Check out this recipe for ${this.recipe.title}!`,
      url: fullUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return; 
      } catch (err) {
        console.log('Error sharing:', err);
      }
    }

    this.copyToClipboard(fullUrl);
  }

  private copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.isCopied = true;
      setTimeout(() => {
        this.isCopied = false;
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  }
}