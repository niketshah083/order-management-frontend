import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService, Category } from '../../services/category.service';

@Component({
  selector: 'app-category-master',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-indigo-50 min-h-screen bg-indigo-50 p-4 md:p-8">
      <div class="max-w-7xl mx-auto">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div class="flex items-center justify-between mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Category Management</h1>
            <button
              (click)="openCategoryDialog()"
              class="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm"
            >
              + Add Category
            </button>
          </div>

          @if (successMessage()) {
          <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800">
            {{ successMessage() }}
          </div>
          }

          @if (errorMessage()) {
          <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
            {{ errorMessage() }}
          </div>
          }

          <!-- Categories Tree -->
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                  <th class="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th class="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (category of displayCategories(); track category.id) {
                <tr class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                      <span [style.margin-left.px]="(category.depth || 0) * 20" class="font-medium text-gray-900">
                        {{ category.name }}
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-gray-600 text-sm">{{ category.description || '-' }}</td>
                  <td class="px-6 py-4 text-sm">
                    <span class="px-3 py-1 rounded-full text-xs font-medium"
                      [class]="category.depth === 0 ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'">
                      {{ category.depth === 0 ? 'Parent' : 'Child' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span [class]="category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                      class="px-3 py-1 text-xs font-semibold rounded-full">
                      {{ category.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                      <button
                        (click)="editCategory(category)"
                        class="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg font-medium text-sm transition-colors"
                      >
                        Edit
                      </button>
                      @if (category.depth === 0) {
                      <button
                        (click)="addSubCategory(category)"
                        class="px-3 py-1 text-green-600 hover:bg-green-50 rounded-lg font-medium text-sm transition-colors"
                      >
                        + Sub
                      </button>
                      }
                      <button
                        (click)="deleteCategory(category.id)"
                        class="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg font-medium text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Category Modal -->
      @if (showDialog()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">
            {{ isEditingId() ? 'Edit Category' : 'Add Category' }}
          </h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Category Name *</label>
              <input
                type="text"
                [(ngModel)]="formData.name"
                placeholder="Enter category name"
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea
                [(ngModel)]="formData.description"
                placeholder="Enter description"
                rows="3"
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
              ></textarea>
            </div>

            @if (isAddingSubCategory()) {
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Parent Category *</label>
              <select
                [(ngModel)]="formData.parentCategoryId"
                class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option [value]="null">Select Parent Category</option>
                @for (cat of parentCategories(); track cat.id) {
                <option [value]="cat.id">{{ cat.name }}</option>
                }
              </select>
            </div>
            }

            <div class="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                [(ngModel)]="formData.isActive"
                id="isActive"
                class="w-4 h-4 rounded border-gray-300"
              />
              <label for="isActive" class="text-sm font-medium text-gray-700">Active</label>
            </div>
          </div>

          <div class="flex gap-3 mt-8">
            <button
              (click)="closeDialog()"
              class="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              (click)="saveCategory()"
              class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
            >
              Save
            </button>
          </div>
        </div>
      </div>
      }
    </div>
  `,
})
export class CategoryMasterComponent implements OnInit {
  private categoryService = inject(CategoryService);

  categories = signal<Category[]>([]);
  showDialog = signal(false);
  isEditingId = signal<number | null>(null);
  isAddingSubCategory = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  
  formData = {
    name: '',
    description: '',
    parentCategoryId: null as number | null,
    isActive: true,
  };

  parentCategories = computed(() => {
    return this.categories()
      .filter((c) => !c.parentCategoryId)
      .map((c) => ({ ...c, depth: 0 }));
  });

  displayCategories = computed(() => {
    const cats = this.categories();
    const result: any[] = [];
    
    const addWithChildren = (category: Category, depth = 0) => {
      result.push({ ...category, depth });
      if (category.children) {
        category.children.forEach((child) => addWithChildren(child, depth + 1));
      }
    };

    cats.forEach((cat) => {
      if (!cat.parentCategoryId) {
        addWithChildren(cat);
      }
    });

    return result;
  });

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (response) => {
        this.categories.set(response.data);
      },
      error: () => {
        this.errorMessage.set('Failed to load categories');
        setTimeout(() => this.errorMessage.set(''), 3000);
      },
    });
  }

  openCategoryDialog() {
    this.isEditingId.set(null);
    this.isAddingSubCategory.set(false);
    this.formData = {
      name: '',
      description: '',
      parentCategoryId: null,
      isActive: true,
    };
    this.showDialog.set(true);
  }

  addSubCategory(parent: Category) {
    this.isEditingId.set(null);
    this.isAddingSubCategory.set(true);
    this.formData = {
      name: '',
      description: '',
      parentCategoryId: parent.id,
      isActive: true,
    };
    this.showDialog.set(true);
  }

  editCategory(category: Category) {
    this.isEditingId.set(category.id);
    this.isAddingSubCategory.set(category.parentCategoryId ? false : false);
    this.formData = {
      name: category.name,
      description: category.description || '',
      parentCategoryId: category.parentCategoryId || null,
      isActive: category.isActive,
    };
    this.showDialog.set(true);
  }

  closeDialog() {
    this.showDialog.set(false);
    this.isEditingId.set(null);
    this.isAddingSubCategory.set(false);
  }

  saveCategory() {
    if (!this.formData.name.trim()) {
      this.errorMessage.set('Category name is required');
      return;
    }

    const payload = {
      name: this.formData.name,
      description: this.formData.description,
      parentCategoryId: this.formData.parentCategoryId,
      isActive: this.formData.isActive,
    };

    if (this.isEditingId()) {
      this.categoryService.updateCategory(this.isEditingId()!, payload).subscribe({
        next: () => {
          this.successMessage.set('Category updated successfully');
          this.loadCategories();
          this.closeDialog();
          setTimeout(() => this.successMessage.set(''), 3000);
        },
        error: () => {
          this.errorMessage.set('Failed to update category');
          setTimeout(() => this.errorMessage.set(''), 3000);
        },
      });
    } else {
      this.categoryService.createCategory(payload).subscribe({
        next: () => {
          this.successMessage.set('Category created successfully');
          this.loadCategories();
          this.closeDialog();
          setTimeout(() => this.successMessage.set(''), 3000);
        },
        error: () => {
          this.errorMessage.set('Failed to create category');
          setTimeout(() => this.errorMessage.set(''), 3000);
        },
      });
    }
  }

  deleteCategory(id: number) {
    if (confirm('Are you sure you want to delete this category?')) {
      this.categoryService.deleteCategory(id).subscribe({
        next: () => {
          this.successMessage.set('Category deleted successfully');
          this.loadCategories();
          setTimeout(() => this.successMessage.set(''), 3000);
        },
        error: () => {
          this.errorMessage.set('Failed to delete category');
          setTimeout(() => this.errorMessage.set(''), 3000);
        },
      });
    }
  }
}
