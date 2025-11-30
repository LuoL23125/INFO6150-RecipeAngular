import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <--- 1. 必须引入 FormsModule
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth';
import { FavoriteService } from '../services/favorite';
import { RecipeService } from '../services/recipe';
import { RecipeCard } from '../recipe-card/recipe-card';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RecipeCard, RouterModule, FormsModule], // <--- 2. 注册
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class Profile implements OnInit {
  authService = inject(AuthService);
  private favoriteService = inject(FavoriteService);
  private recipeService = inject(RecipeService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  user: any = null;
  favorites: any[] = [];
  customRecipes: any[] = [];
  mealPlans: any[] = [];
  
  activeTab = 'favorites'; 

  // === 新增：表单数据模型 ===
  profileForm = {
    firstName: '',
    lastName: '',
    email: '',
    newPassword: '' // 仅用于修改，默认留空
  };

  ngOnInit() {
    this.user = this.authService.currentUser();
    
    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }

    // 初始化表单数据
    this.profileForm.firstName = this.user.firstName;
    this.profileForm.lastName = this.user.lastName;
    this.profileForm.email = this.user.email;

    this.loadFavorites();
    this.loadCustomRecipes();
    this.loadMealPlans();

    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab = params['tab'];
        this.cdr.detectChanges();
      }
    });
  }

  // === 新增：保存修改 ===
  onUpdateProfile() {
    if (!this.user) return;

    // 准备要更新的数据
    const updateData: any = {
      firstName: this.profileForm.firstName,
      lastName: this.profileForm.lastName,
      // 同时更新全名，保持数据一致性
      name: `${this.profileForm.firstName} ${this.profileForm.lastName}`,
      email: this.profileForm.email
    };

    // 只有当用户填了新密码时才更新密码
    if (this.profileForm.newPassword && this.profileForm.newPassword.trim() !== '') {
      updateData.password = this.profileForm.newPassword;
    }

    this.authService.updateProfile(this.user.id, updateData).subscribe({
      next: (updatedUser) => {
        alert('Profile updated successfully!');
        this.user = updatedUser; // 更新本地视图
        this.profileForm.newPassword = ''; // 清空密码框
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        alert('Failed to update profile.');
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

  loadMealPlans() {
    if (this.user) {
      this.recipeService.getUserMealPlans(this.user.id).subscribe({
        next: (data) => {
          this.mealPlans = data;
          this.cdr.detectChanges();
        }
      });
    }
  }

  deletePlan(id: string) {
    if (confirm('Are you sure you want to delete this meal plan?')) {
      this.recipeService.deleteMealPlan(id).subscribe({
        next: () => {
          this.loadMealPlans();
        },
        error: () => alert('Failed to delete plan.')
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