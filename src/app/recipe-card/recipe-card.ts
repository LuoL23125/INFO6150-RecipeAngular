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

  isCopied = false;

  isFavorite = computed(() => {
    return this.favoriteService.isFavorite(this.recipe.id);
  });

  get isOwner(): boolean {
    const user = this.authService.currentUser();
    return user && this.recipe.userId && String(this.recipe.userId) === String(user.id);
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

  // === 升级版分享功能 ===
  async onShare(event: Event) {
    event.stopPropagation();
    event.preventDefault();

    // 1. 构建完整 URL
    const urlTree = this.router.createUrlTree(this.detailLink);
    const fullUrl = window.location.origin + urlTree.toString();
    const shareData = {
      title: this.recipe.title || 'Delicious Recipe',
      text: `Check out this recipe for ${this.recipe.title}!`,
      url: fullUrl
    };

    // 2. 尝试调用原生分享 (Web Share API)
    // 注意：navigator.share 只能在 HTTPS 或 localhost 环境下使用
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        console.log('Shared successfully');
        return; // 如果分享成功，就不用复制链接了
      } catch (err) {
        console.log('Error sharing or user cancelled:', err);
        // 如果用户取消了分享，或者报错了，我们不一定要降级复制，看你需求
        // 这里我们选择：如果报错（非取消），尝试降级复制
      }
    }

    // 3. 降级方案：复制到剪贴板
    // (如果浏览器不支持原生分享，或者在非安全环境下)
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