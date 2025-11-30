import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth';
import { RecipeService } from '../services/recipe';

@Component({
  selector: 'app-meal-planner',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './meal-planner.html',
  styles: [`
    .day-card { border-left: 5px solid #2c7a38; }
    .meal-slot { transition: background 0.2s; }
    .meal-slot:hover { background-color: #f8f9fa; }
    .custom-green-btn { background-color: #2c7a38; color: white; }
    .custom-green-btn:hover { background-color: #215c2b; }
  `]
})
export class MealPlanner {
  private authService = inject(AuthService);
  private recipeService = inject(RecipeService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // 配置项
  targetCalories = 2000;
  selectedDiet = '';
  // 新增：排除成分
  excludeIngredients = '';

  // 完整的 Diets 列表
  diets = [
    'Gluten Free', 'Ketogenic', 'Vegetarian', 'Lacto-Vegetarian',
    'Ovo-Vegetarian', 'Vegan', 'Pescetarian', 'Paleo',
    'Primal', 'Low FODMAP', 'Whole30'
  ];

  isLoading = false;
  currentPlan: any = null;
  formattedWeek: any[] = []; 

  constructor() {
    if (!this.authService.currentUser()) {
      this.router.navigate(['/login']);
    }
  }

  generatePlan() {
    this.isLoading = true;
    
    // 调用时传入 excludeIngredients
    this.recipeService.generateWeeklyPlan(this.targetCalories, this.selectedDiet, this.excludeIngredients).subscribe({
      next: (data: any) => {
        console.log('生成计划成功:', data);
        this.currentPlan = data;
        this.formatDataForView(data.week);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('生成失败', err);
        alert('Could not generate plan. API quota might be exceeded.');
        this.isLoading = false;
      }
    });
  }

  formatDataForView(weekObj: any) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    this.formattedWeek = days.map(day => ({
      name: day.charAt(0).toUpperCase() + day.slice(1), 
      ...weekObj[day] 
    }));
  }

  savePlan() {
    const user = this.authService.currentUser();
    if (!user || !this.currentPlan) return;

    const planToSave = {
      userId: user.id,
      name: `Weekly Plan (${this.selectedDiet || 'Standard'} - ${this.targetCalories} cal)`,
      // 保存用户的设置，方便查看时参考
      settings: {
        calories: this.targetCalories,
        diet: this.selectedDiet,
        exclude: this.excludeIngredients
      },
      createdAt: new Date().toISOString(),
      week: this.currentPlan.week
    };

    this.recipeService.saveMealPlan(planToSave).subscribe({
      next: () => {
        alert('Plan saved to your profile!');
        // 保存后跳转到 Profile 的 plans 页面
        this.router.navigate(['/profile'], { queryParams: { tab: 'plans' } });
      },
      error: () => alert('Failed to save plan.')
    });
  }
}