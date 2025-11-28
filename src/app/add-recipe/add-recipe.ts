import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core'; // <--- 1. 引入 ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth';
import { RecipeService } from '../services/recipe';

@Component({
  selector: 'app-add-recipe',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-recipe.html',
  styles: [`
    .custom-green-btn { background-color: #2c7a38; color: white; }
    .custom-green-btn:hover { background-color: #215c2b; }
    .btn-outline-green { color: #2c7a38; border-color: #2c7a38; }
    .btn-outline-green:hover { background-color: #2c7a38; color: white; }
  `]
})
export class AddRecipe implements OnInit {
  private authService = inject(AuthService);
  private recipeService = inject(RecipeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef); // <--- 2. 注入它

  recipeData: any = {
    title: '',
    description: '',
    image: 'https://via.placeholder.com/556x370?text=My+Delicious+Food', 
    servings: 2,
    prepTime: 15,
    cookTime: 15,
    ingredients: [''], 
    instructions: [''], 
    isPublic: false
  };

  isEditMode = false;
  recipeId: string | null = null;

  constructor() {
    if (!this.authService.currentUser()) {
      this.router.navigate(['/login']);
    }
  }

  ngOnInit() {
    this.recipeId = this.route.snapshot.paramMap.get('id');
    
    if (this.recipeId) {
      this.isEditMode = true;
      this.loadRecipeForEdit(this.recipeId);
    }
  }

  loadRecipeForEdit(id: string) {
    this.recipeService.getCustomRecipeById(id).subscribe(recipe => {
      if (recipe) {
        // 填充表单
        this.recipeData = { ...recipe };
        
        // 数据清洗：确保数组不为空
        if (!this.recipeData.ingredients || this.recipeData.ingredients.length === 0) {
          this.recipeData.ingredients = [''];
        }
        if (!this.recipeData.instructions || this.recipeData.instructions.length === 0) {
          this.recipeData.instructions = [''];
        }

        // <--- 3. 关键修复：强制刷新视图，让数据立即回显 --->
        this.cdr.detectChanges();
      }
    });
  }

  addIngredient() {
    this.recipeData.ingredients.push('');
  }

  removeIngredient(index: number) {
    if (this.recipeData.ingredients.length > 1) {
      this.recipeData.ingredients.splice(index, 1);
    }
  }

  addInstruction() {
    this.recipeData.instructions.push('');
  }

  removeInstruction(index: number) {
    if (this.recipeData.instructions.length > 1) {
      this.recipeData.instructions.splice(index, 1);
    }
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }

  onSubmit() {
    const user = this.authService.currentUser();
    if (!user) return;

    // 构造数据
    const recipeToSave = {
      ...this.recipeData,
      ingredients: this.recipeData.ingredients.filter((i: string) => i.trim() !== ''),
      instructions: this.recipeData.instructions.filter((i: string) => i.trim() !== ''),
      totalTime: this.recipeData.prepTime + this.recipeData.cookTime,
      readyInMinutes: this.recipeData.prepTime + this.recipeData.cookTime,
      userId: user.id,
      updatedAt: new Date().toISOString()
    };

    if (this.isEditMode && this.recipeId) {
      // Update
      this.recipeService.updateCustomRecipe(this.recipeId, recipeToSave).subscribe({
        next: () => this.router.navigate(['/profile'], { queryParams: { tab: 'custom' } }),
        error: (err) => console.error('Update failed', err)
      });
    } else {
      // Create
      recipeToSave.createdAt = new Date().toISOString();
      this.recipeService.addCustomRecipe(recipeToSave).subscribe({
        next: () => this.router.navigate(['/profile'], { queryParams: { tab: 'custom' } }),
        error: (err) => console.error('Create failed', err)
      });
    }
  }
}