import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipeService } from '../services/recipe';
import { RecipeCard } from '../recipe-card/recipe-card';
import { SearchBar } from '../search-bar/search-bar';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RecipeCard, SearchBar],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home implements OnInit {
  private recipeService = inject(RecipeService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  recipes: any[] = [];
  isSingleView = true; 

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const searchTerm = params['search'];
      this.recipes = []; // 清空当前列表
      
      if (searchTerm) {
        this.runSearchQuery(searchTerm);
      } else {
        this.loadRandomRecipe();
      }
    });
  }

  performSearch(term: string) {
    this.router.navigate([], { 
      relativeTo: this.route,
      queryParams: { search: term }
    });
  }

  // === 搜索逻辑 ===
  runSearchQuery(term: string) {
    this.isSingleView = false;
    
    // 1. 尝试 API 搜索
    this.recipeService.getRecipes(term).subscribe({
      next: (data: any) => {
        console.log('API 搜索成功:', data);
        this.recipes = data.results;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('API 搜索失败，切换到本地搜索...', err);
        // 2. API 失败？执行本地精准搜索！
        this.searchFromLocal(term);
      }
    });
  }

  // === 修改重点：本地搜索方法 (改为前端过滤) ===
  searchFromLocal(term: string) {
    // 获取所有本地数据 (126条数据瞬间就能拿完)
    this.recipeService.getLocalRecipes().subscribe({
      next: (data: any) => {
        // 3. 在前端用 JS 过滤，只匹配标题 (忽略大小写)
        // 这样 "beef" 就绝对不会匹配到 "chicken"
        const filteredRecipes = data.filter((recipe: any) => 
          recipe.title.toLowerCase().includes(term.toLowerCase())
        );

        console.log(`本地精准搜索 "${term}": 找到 ${filteredRecipes.length} 个结果`);
        this.recipes = filteredRecipes; 
        this.cdr.detectChanges();
      },
      error: () => {
        this.recipes = [];
        this.cdr.detectChanges();
      }
    });
  }

  // === 随机加载逻辑 ===
  loadRandomRecipe() {
    this.isSingleView = true;
    this.recipeService.getRandomRecipe().subscribe({
      next: (data: any) => {
        this.recipes = data.recipes;
        if (this.recipes.length > 0) this.saveToLocal(this.recipes[0]);
        this.cdr.detectChanges();
      },
      error: () => {
        console.warn('API 随机失败，从本地随机取一个...');
        this.loadFromLocal();
      }
    });
  }

  saveToLocal(recipe: any) {
    this.recipeService.saveRecipeToLocal(recipe).subscribe({
      next: () => {},
      error: () => {}
    });
  }

  loadFromLocal() {
    this.recipeService.getLocalRecipes().subscribe({
      next: (data: any) => {
        if (data && data.length > 0) {
          const randomIndex = Math.floor(Math.random() * data.length);
          this.recipes = [data[randomIndex]];
          this.isSingleView = true;
          this.cdr.detectChanges();
        }
      }
    });
  }
}