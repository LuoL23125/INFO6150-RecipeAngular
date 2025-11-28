import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth';
import { FavoriteService } from '../services/favorite';
import { RecipeService } from '../services/recipe'; // <--- 确保引入
import { RecipeCard } from '../recipe-card/recipe-card';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RecipeCard, RouterModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class Profile implements OnInit {
  authService = inject(AuthService);
  private favoriteService = inject(FavoriteService);
  private recipeService = inject(RecipeService); // <--- 注入
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  user: any = null;
  favorites: any[] = [];
  customRecipes: any[] = []; // <--- 新增数组
  
  activeTab = 'favorites'; 

  ngOnInit() {
    this.user = this.authService.currentUser();
    
    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadFavorites();
    this.loadCustomRecipes(); // <--- 调用加载自定义食谱

    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab = params['tab'];
        this.cdr.detectChanges();
      }
    });
  }

  loadFavorites() {
    if (this.user) {
      this.favoriteService.getUserFavorites(this.user.id).subscribe({
        next: (data) => {
          this.favorites = data.map(f => ({ ...f, id: f.recipeId }));
          this.cdr.detectChanges();
        }
      });
    }
  }

  // 新增：加载自定义食谱
  loadCustomRecipes() {
    if (this.user) {
      this.recipeService.getUserCustomRecipes(this.user.id).subscribe({
        next: (data) => {
          this.customRecipes = data;
          this.cdr.detectChanges();
        }
      });
    }
  }

  setTab(tabName: string) {
    this.activeTab = tabName;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tabName }
    });
  }

  getInitials(): string {
    if (!this.user) return '';
    if (this.user.firstName && this.user.lastName) {
      return (this.user.firstName[0] + this.user.lastName[0]).toUpperCase();
    }
    return 'ME';
  }
}