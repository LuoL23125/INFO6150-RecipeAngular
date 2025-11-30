import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { RecipeService } from '../services/recipe';
import { Review } from '../review/review'; // <--- 1. 引入 Review 组件

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, Review], // <--- 2. 注册
  templateUrl: './recipe-detail.html',
  styleUrls: ['./recipe-detail.css']
})
export class RecipeDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private recipeService = inject(RecipeService);
  private cdr = inject(ChangeDetectorRef);

  recipe: any = null;
  loading = true;
  // 保存当前 ID，传给子组件
  currentId: string | null = null;

  ngOnInit() {
    const rawId = this.route.snapshot.paramMap.get('id');
    
    if (rawId) {
      // 这里的 rawId 可能是 "custom-123" 或者 "123"
      // 我们需要把这个 ID 原封不动传给 Review 组件，作为关联 ID
      this.currentId = rawId;

      if (rawId.startsWith('custom-')) {
        const realId = rawId.replace('custom-', '');
        this.loadFromCustom(realId);
      } else {
        this.loadRecipeDetail(rawId);
      }
    }
  }

  isList(val: any): boolean {
    return Array.isArray(val);
  }

  getNutrient(recipe: any, name: string): string {
    if (!recipe.nutrition || !recipe.nutrition.nutrients) return 'N/A';
    const nutrient = recipe.nutrition.nutrients.find((n: any) => n.name === name);
    return nutrient ? `${nutrient.amount}${nutrient.unit}` : 'N/A';
  }

  loadRecipeDetail(id: string) {
    this.loading = true;
    this.recipeService.getRecipeById(id).subscribe({
      next: (data) => {
        this.recipe = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadFromLocal(id);
      }
    });
  }

  loadFromLocal(id: string) {
    this.recipeService.getLocalRecipeById(id).subscribe({
      next: (data) => {
        if (data) {
          this.recipe = data;
          this.loading = false;
          this.cdr.detectChanges();
        } else {
          this.loadFromCustom(id);
        }
      },
      error: () => this.loadFromCustom(id)
    });
  }

  loadFromCustom(id: string) {
    this.recipeService.getCustomRecipeById(id).subscribe({
      next: (data) => {
        if (data) this.recipe = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}