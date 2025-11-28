import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; // <--- 1. 引入 RouterModule
import { RecipeService } from '../services/recipe';
import { AuthService } from '../services/auth';
import { RecipeCard } from '../recipe-card/recipe-card';
import { SearchBar } from '../search-bar/search-bar';

@Component({
  selector: 'app-home',
  standalone: true,
  // 2. 关键：把 RouterModule 放入 imports 数组
  // 这样 HTML 里的 routerLink 才会生效
  imports: [CommonModule, RouterModule, RecipeCard, SearchBar],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home implements OnInit {
  private recipeService = inject(RecipeService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public authService = inject(AuthService);
  
  recipes: any[] = [];
  isSingleView = true; 
  
  showBanner = true;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const searchTerm = params['search'];
      this.recipes = [];
      
      if (searchTerm) {
        this.runSearchQuery(searchTerm);
      } else {
        this.loadRandomRecipe();
      }
    });
  }

  closeBanner() {
    this.showBanner = false;
  }

  performSearch(term: string) {
    this.router.navigate([], { 
      relativeTo: this.route,
      queryParams: { search: term }
    });
  }

  runSearchQuery(term: string) {
    this.isSingleView = false;
    
    this.recipeService.getRecipes(term).subscribe({
      next: (data: any) => {
        this.recipes = data.results;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('API 搜索失败，切换到本地搜索...', err);
        this.searchFromLocal(term);
      }
    });
  }

  searchFromLocal(term: string) {
    this.recipeService.getLocalRecipes().subscribe({
      next: (data: any) => {
        const filteredRecipes = data.filter((recipe: any) => 
          recipe.title.toLowerCase().includes(term.toLowerCase())
        );
        this.recipes = filteredRecipes; 
        this.cdr.detectChanges();
      },
      error: () => {
        this.recipes = [];
        this.cdr.detectChanges();
      }
    });
  }

  loadRandomRecipe() {
    this.isSingleView = true;
    this.recipeService.getRandomRecipe().subscribe({
      next: (data: any) => {
        this.recipes = data.recipes;
        if (this.recipes.length > 0) this.saveToLocal(this.recipes[0]);
        this.cdr.detectChanges();
      },
      error: () => {
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