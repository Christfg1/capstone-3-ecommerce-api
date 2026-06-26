let productService;

class ProductService {

    photos = [];
    products = [];


    filter = {
        cat: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        search: undefined,
        queryString: () => {
            let qs = "";
            if(this.filter.cat){ qs = `cat=${this.filter.cat}`; }
            if(this.filter.minPrice)
            {
                const minP = `minPrice=${this.filter.minPrice}`;
                if(qs.length>0) {   qs += `&${minP}`; }
                else { qs = minP; }
            }
            if(this.filter.maxPrice)
            {
                const maxP = `maxPrice=${this.filter.maxPrice}`;
                if(qs.length>0) {   qs += `&${maxP}`; }
                else { qs = maxP; }
            }

            return qs.length > 0 ? `?${qs}` : "";
        }
    }

    constructor() {

        //load list of photos into memory
        axios.get("./images/products/photos.json")
            .then(response => {
                this.photos = response.data;
            });
    }

    hasPhoto(photo){
        return this.photos.filter(p => p == photo).length > 0;
    }

    addCategoryFilter(cat)
    {
        if(cat == 0) this.clearCategoryFilter();
        else this.filter.cat = cat;
    }
    addMinPriceFilter(price)
    {
        if(price == 0 || price == "") this.clearMinPriceFilter();
        else this.filter.minPrice = price;
    }
    addMaxPriceFilter(price)
    {
        if(price == 0 || price == "") this.clearMaxPriceFilter();
        else this.filter.maxPrice = price;
    }
    addSearchFilter(search)
    {
        if(search == "") this.clearSearchFilter();
        else this.filter.search = search.toLowerCase();
    }

    clearCategoryFilter()
    {
        this.filter.cat = undefined;
    }
    clearMinPriceFilter()
    {
        this.filter.minPrice = undefined;
    }
    clearMaxPriceFilter()
    {
        this.filter.maxPrice = undefined;
    }
    clearSearchFilter()
    {
        this.filter.search = undefined;
    }

    search()
    {
        const url = `${config.baseUrl}/products${this.filter.queryString()}`;

        const content = document.getElementById("content");
        if(content) content.innerHTML = `<p class="content-message">Loading products...</p>`;

        axios.get(url)
             .then(response => {
                 let data = {};
                 data.products = response.data;

                 if(this.filter.search)
                 {
                     data.products = data.products.filter(product =>
                         product.name.toLowerCase().includes(this.filter.search) ||
                         product.description.toLowerCase().includes(this.filter.search)
                     );
                 }

                 data.products.forEach(product => {
                     if(!this.hasPhoto(product.imageUrl))
                     {
                         product.imageUrl = "no-image.jpg";
                     }

                     product.priceDisplay = Number(product.price).toFixed(2);
                 })

                 this.products = data.products;

                 if(data.products.length === 0)
                 {
                     if(content) content.innerHTML = `<p class="content-message">No products match your search.</p>`;
                     return;
                 }

                 templateBuilder.build('product', data, 'content', () => this.enableButtons());

             })
            .catch(error => {

                if(content) content.innerHTML = "";

                const data = {
                    error: "Searching products failed."
                };

                templateBuilder.append("error", data, "errors")
            });
    }

    enableButtons()
    {
        const buttons = [...document.querySelectorAll(".add-button")];
        const adminButtons = [...document.querySelectorAll(".admin-button")];

        if(userService.isLoggedIn())
        {
            buttons.forEach(button => {
                button.classList.remove("invisible")
            });
        }
        else
        {
            buttons.forEach(button => {
                button.classList.add("invisible")
            });
        }

        if(userService.isAdmin())
        {
            adminButtons.forEach(button => {
                button.classList.remove("invisible")
            });
        }
        else
        {
            adminButtons.forEach(button => {
                button.classList.add("invisible")
            });
        }

        const stockLabels = [...document.querySelectorAll(".stock")];

        stockLabels.forEach(label => {
            const stock = parseInt(label.dataset.stock, 10);
            const addButton = label.closest(".product")?.querySelector(".add-button .btn");

            if(stock <= 0)
            {
                label.innerText = "Out of stock";
                label.classList.add("out-of-stock");

                if(addButton)
                {
                    addButton.disabled = true;
                    addButton.innerText = "Out of Stock";
                }
            }
            else if(stock <= 5)
            {
                label.classList.add("low-stock");
            }
        });

        const photos = [...document.querySelectorAll(".product-photo")];

        photos.forEach(photo => {
            // enableButtons can run again (e.g. on login) over the same DOM; avoid double-binding.
            if(photo.dataset.bound) return;
            photo.dataset.bound = "true";

            photo.addEventListener("click", () => {
                showImageDetailForm(photo.dataset.name, photo.dataset.image);
            });
        });
    }

    showEditForm(productId)
    {
        const product = this.products.find(p => p.productId === productId);
        if(!product) return;

        const modal = document.createElement("div");
        modal.classList.add("modal");
        modal.id = "product-edit-form";

        const dialog = document.createElement("div");
        dialog.classList.add("modal-dialog");

        const content = document.createElement("div");
        content.classList.add("modal-content");

        const header = document.createElement("div");
        header.classList.add("modal-header");

        const title = document.createElement("h5");
        title.classList.add("modal-title");
        title.innerText = `Edit ${product.name}`;
        header.appendChild(title);

        const closeButton = document.createElement("button");
        closeButton.classList.add("btn-close");
        closeButton.setAttribute("aria-label", "Close");
        closeButton.addEventListener("click", () => modal.remove());
        header.appendChild(closeButton);

        content.appendChild(header);

        const body = document.createElement("div");
        body.classList.add("modal-body");

        const nameInput = this.buildFormField(body, "Name", product.name);
        const priceInput = this.buildFormField(body, "Price", product.price);
        const descInput = this.buildFormField(body, "Description", product.description);
        const stockInput = this.buildFormField(body, "Stock", product.stock);

        content.appendChild(body);

        const footer = document.createElement("div");
        footer.classList.add("modal-footer");

        const cancelButton = document.createElement("button");
        cancelButton.classList.add("btn", "btn-secondary");
        cancelButton.innerText = "Cancel";
        cancelButton.addEventListener("click", () => modal.remove());
        footer.appendChild(cancelButton);

        const saveButton = document.createElement("button");
        saveButton.classList.add("btn", "btn-primary");
        saveButton.innerText = "Save";
        saveButton.addEventListener("click", () => {
            const updated = {
                ...product,
                name: nameInput.value,
                price: parseFloat(priceInput.value),
                description: descInput.value,
                stock: parseInt(stockInput.value, 10)
            };

            this.updateProduct(updated, () => {
                modal.remove();
                this.search();
            });
        });
        footer.appendChild(saveButton);

        content.appendChild(footer);
        dialog.appendChild(content);
        modal.appendChild(dialog);
        document.body.appendChild(modal);
    }

    buildFormField(parent, labelText, value)
    {
        const wrapper = document.createElement("div");
        wrapper.classList.add("mb-3");

        const label = document.createElement("label");
        label.classList.add("form-label");
        label.innerText = labelText;
        wrapper.appendChild(label);

        const input = document.createElement("input");
        input.type = "text";
        input.classList.add("form-control");
        input.value = value !== undefined ? value : "";
        wrapper.appendChild(input);

        parent.appendChild(wrapper);

        return input;
    }

    updateProduct(product, callback)
    {
        const url = `${config.baseUrl}/products/${product.productId}`;

        axios.put(url, product)
             .then(() => {
                 if(callback) callback();
             })
             .catch(error => {

                 const data = {
                     error: "Update product failed."
                 };

                 templateBuilder.append("error", data, "errors")
             })
    }

}





document.addEventListener('DOMContentLoaded', () => {
    productService = new ProductService();

});
