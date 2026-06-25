package org.yearup.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.yearup.models.Category;
import org.yearup.models.Product;
import org.yearup.service.CategoryService;
import org.yearup.service.ProductService;

import java.util.List;

@RestController
@RequestMapping("/categories")
@CrossOrigin
public class CategoriesController
{
    private final CategoryService categoryService;
    private final ProductService productService;

    public CategoriesController(CategoryService categoryService, ProductService productService)
    {
        this.categoryService = categoryService;
        this.productService = productService;
    }

    @GetMapping
    public List<Category> getAll()
    {
        return categoryService.getAllCategories();
    }

    @GetMapping("{id}")
    public ResponseEntity<Category> getById(@PathVariable int id)
    {
        Category category = categoryService.getById(id);

        if (category == null)
        {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(category);
    }

    @GetMapping("{categoryId}/products")
    public List<Product> getProductsById(@PathVariable int categoryId)
    {
        return productService.getProductsByCategoryId(categoryId);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Category> addCategory(@RequestBody Category category)
    {
        Category newCategory = categoryService.create(category);
        return ResponseEntity.status(HttpStatus.CREATED).body(newCategory);
    }

    @PutMapping("{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Category updateCategory(@PathVariable int id, @RequestBody Category category)
    {
        return categoryService.update(id, category);
    }

    @DeleteMapping("{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCategory(@PathVariable int id)
    {
        categoryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}