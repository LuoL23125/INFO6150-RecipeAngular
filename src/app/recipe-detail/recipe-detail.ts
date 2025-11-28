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
    const rawId = this.route.snapshot.paramMap.get('id');
    
    if (rawId) {
      // === 修改重点：检查前缀 ===
      if (rawId.startsWith('custom-')) {
        // 如果是 custom- 开头，去掉前缀，直接查 Custom 数据库
        const realId = rawId.replace('custom-', '');
        console.log('检测到自定义食谱 URL，直接加载 Custom ID:', realId);
        this.loadFromCustom(realId);
      } else {
        // 否则走正常的 API 流程
        this.loadRecipeDetail(rawId);
      }
    }
  }

  isList(val: any): boolean {
    return Array.isArray(val);
  }

  loadRecipeDetail(id: string) {
    this.loading = true;
    
    // 1. 尝试请求 API
    this.recipeService.getRecipeById(id).subscribe({
      next: (data) => {
        this.recipe = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('API 失败，尝试查找本地缓存...', err);
        // 2. API 失败 -> 查 Cached
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
          // 3. Cached 也没找到 -> 尝试 Custom (兜底)
          // 防止用户手动输了 ID 但没加 custom- 前缀
          this.loadFromCustom(id);
        }
      },
      error: () => this.loadFromCustom(id)
    });
  }

  loadFromCustom(id: string) {
    this.recipeService.getCustomRecipeById(id).subscribe({
      next: (data) => {
        if (data) {
          this.recipe = data;
        } else {
          console.error('Custom Recipe 也未找到');
        }
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