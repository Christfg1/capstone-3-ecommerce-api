let categoryService;

class CategoryService {


    getAllCategories(callback)
    {
        const url = `${config.baseUrl}/categories`;

        return axios.get(url)
            .then(response => {
                callback(response.data);
            })
            .catch(error => {

                const data = {
                    error: "Loading categories failed."
                };

                templateBuilder.append("error", data, "errors")
            });
    }

    addCategory(category, callback)
    {
        const url = `${config.baseUrl}/categories`;

        return axios.post(url, category)
            .then(response => {
                if(callback) callback(response.data);
            })
            .catch(error => {

                const data = {
                    error: "Add category failed."
                };

                templateBuilder.append("error", data, "errors")
            });
    }

    updateCategory(category, callback)
    {
        const url = `${config.baseUrl}/categories/${category.categoryId}`;

        return axios.put(url, category)
            .then(response => {
                if(callback) callback(response.data);
            })
            .catch(error => {

                const data = {
                    error: "Update category failed."
                };

                templateBuilder.append("error", data, "errors")
            });
    }

    deleteCategory(categoryId, callback)
    {
        const url = `${config.baseUrl}/categories/${categoryId}`;

        return axios.delete(url)
            .then(() => {
                if(callback) callback();
            })
            .catch(error => {

                const data = {
                    error: "Delete category failed."
                };

                templateBuilder.append("error", data, "errors")
            });
    }

    loadAdminPage()
    {
        const main = document.getElementById("main");
        main.innerHTML = "";

        const filterDiv = document.createElement("div");
        filterDiv.classList.add("filter-box");
        main.appendChild(filterDiv);

        const contentDiv = document.createElement("div");
        contentDiv.id = "content";
        contentDiv.classList.add("content-form");

        const heading = document.createElement("h1");
        heading.innerText = "Manage Categories";
        contentDiv.appendChild(heading);

        const listDiv = document.createElement("div");
        listDiv.id = "category-admin-list";
        contentDiv.appendChild(listDiv);

        const addHeading = document.createElement("h3");
        addHeading.classList.add("recommendations-heading");
        addHeading.innerText = "Add Category";
        contentDiv.appendChild(addHeading);

        const addForm = this.buildCategoryForm({}, (category) => {
            this.addCategory(category, () => this.loadAdminPage());
        }, "Add Category");
        contentDiv.appendChild(addForm);

        main.appendChild(contentDiv);

        this.getAllCategories(categories => this.renderCategoryList(categories, listDiv));
    }

    renderCategoryList(categories, container)
    {
        container.innerHTML = "";

        categories.forEach(category => {
            const row = document.createElement("div");
            row.classList.add("category-row");

            const name = document.createElement("span");
            name.innerText = category.name;
            row.appendChild(name);

            const actions = document.createElement("div");
            actions.classList.add("category-row-actions");

            const editButton = document.createElement("button");
            editButton.classList.add("btn", "btn-outline-secondary", "btn-sm");
            editButton.innerText = "Edit";
            editButton.addEventListener("click", () => this.showEditCategoryForm(category, row));
            actions.appendChild(editButton);

            const deleteButton = document.createElement("button");
            deleteButton.classList.add("btn", "btn-outline-danger", "btn-sm");
            deleteButton.innerText = "Delete";
            deleteButton.addEventListener("click", () => {
                this.deleteCategory(category.categoryId, () => this.loadAdminPage());
            });
            actions.appendChild(deleteButton);

            row.appendChild(actions);
            container.appendChild(row);
        });
    }

    showEditCategoryForm(category, row)
    {
        const existing = document.getElementById("category-edit-form");
        if(existing) existing.remove();

        const form = this.buildCategoryForm(category, (updated) => {
            updated.categoryId = category.categoryId;
            this.updateCategory(updated, () => this.loadAdminPage());
        }, "Save Changes");
        form.id = "category-edit-form";

        row.after(form);
    }

    buildCategoryForm(category, onSubmit, buttonText)
    {
        const form = document.createElement("div");
        form.classList.add("category-form");

        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.classList.add("form-control");
        nameInput.placeholder = "Category Name";
        nameInput.value = category.name || "";
        form.appendChild(nameInput);

        const descInput = document.createElement("input");
        descInput.type = "text";
        descInput.classList.add("form-control");
        descInput.placeholder = "Description";
        descInput.value = category.description || "";
        form.appendChild(descInput);

        const submitButton = document.createElement("button");
        submitButton.classList.add("btn", "btn-success", "btn-sm");
        submitButton.innerText = buttonText;
        submitButton.addEventListener("click", () => {
            onSubmit({
                name: nameInput.value,
                description: descInput.value
            });
        });
        form.appendChild(submitButton);

        return form;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    categoryService = new CategoryService();
});
