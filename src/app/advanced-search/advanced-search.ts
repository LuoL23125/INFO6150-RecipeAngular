import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { RecipeService } from '../services/recipe';
import { RecipeCard } from '../recipe-card/recipe-card';

@Component({
  selector: 'app-advanced-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RecipeCard],
  templateUrl: './advanced-search.html',
  styles: [`
    .filter-card { background-color: #f8f9fa; border: 1px solid #e9ecef; }
    .form-check-input:checked { background-color: #2c7a38; border-color: #2c7a38; }
    .custom-green-btn { background-color: #2c7a38; color: white; }
    .custom-green-btn:hover { background-color: #215c2b; }
  `]
})
export class AdvancedSearch {
  private authService = inject(AuthService);
  private recipeService = inject(RecipeService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // 选项配置
  availableDiets = ['Vegetarian', 'Vegan', 'Gluten Free'];
  availableIntolerances = ['Dairy', 'Peanut', 'Gluten'];

  // 表单状态
  filters = {
    query: '',
    ingredients: '', // 逗号分隔字符串
    diets: [] as string[],
    intolerances: [] as string[]
  };

  recipes: any[] = [];
  isSearching = false;
  hasSearched = false;

  constructor() {
    // 权限控制：仅登录用户可用
    if (!this.authService.currentUser()) {
      this.router.navigate(['/login']);
    }
  }

  // 处理 Checkbox 变化
  onCheckboxChange(e: any, array: string[], value: string) {
    if (e.target.checked) {
      array.push(value);
    } else {
      const index = array.indexOf(value);
      if (index > -1) array.splice(index, 1);
    }
  }

  onSearch() {
    this.isSearching = true;
    this.hasSearched = true;
    this.recipes = [];

    // 1. 尝试 API 搜索
    this.recipeService.complexSearchRemote(this.filters).subscribe({
      next: (data: any) => {
        console.log('API 高级搜索结果:', data);
        this.recipes = data.results;
        this.isSearching = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('API 失败，启用本地高级搜索...', err);
        // 2. 失败则使用本地过滤
        this.searchLocal();
      }
    });
  }

  searchLocal() {
    this.recipeService.complexSearchLocal(this.filters).subscribe({
      next: (results) => {
        console.log('本地高级搜索结果:', results);
        this.recipes = results;
        this.isSearching = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSearching = false;
        this.cdr.detectChanges();
      }
    });
  }
}