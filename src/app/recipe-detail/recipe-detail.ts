import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { RecipeService } from '../services/recipe';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './recipe-detail.html',
  styleUrls: ['./recipe-detail.css']
})
export class RecipeDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private recipeService = inject(RecipeService);
  private cdr = inject(ChangeDetectorRef);

  recipe: any = null;
  loading = true;

  ngOnInit() {
    // 1. 从 URL 获取 ID (比如 /recipe/646877 -> 拿到 646877)
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id) {
      this.loadRecipeDetail(id);
    }
  }

  loadRecipeDetail(id: string) {
    this.loading = true;
    
    // 2. 尝试请求 API
    this.recipeService.getRecipeById(id).subscribe({
      next: (data) => {
        console.log('API 详情获取成功:', data);
        this.recipe = data;
        this.loading = false;
        this.cdr.detectChanges(); // 强制刷新视图
      },
      error: (err) => {
        console.warn('API 失败，尝试查找本地缓存...', err);
        this.loadFromLocal(id);
      }
    });
  }

  loadFromLocal(id: string) {
    this.recipeService.getLocalRecipeById(id).subscribe({
      next: (data) => {
        console.log('本地详情查找结果:', data);
        this.recipe = data;
        this.loading = false;
        this.cdr.detectChanges(); // 强制刷新视图
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}