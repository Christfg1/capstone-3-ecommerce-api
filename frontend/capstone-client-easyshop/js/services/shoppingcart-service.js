let cartService;

class ShoppingCartService {

    cart = {
        items:[],
        total:0
    };

    addToCart(productId)
    {
        const url = `${config.baseUrl}/cart/products/${productId}`;

        return axios.post(url, {})
            .then(response => {
                this.setCart(response.data)

                this.updateCartDisplay()

            })
            .catch(error => {

                const data = {
                    error: "Add to cart failed."
                };

                templateBuilder.append("error", data, "errors")
            })
    }

    setCart(data)
    {
        this.cart = {
            items: [],
            total: 0
        }

        this.cart.total = data.total;

        for (const [key, value] of Object.entries(data.items)) {
            // A removed item is stored server-side with quantity 0; hide it everywhere.
            if(value.quantity > 0) {
                this.cart.items.push(value);
            }
        }
    }

    loadCart()
    {

        const url = `${config.baseUrl}/cart`;

        axios.get(url)
            .then(response => {
                this.setCart(response.data)

                this.updateCartDisplay()

            })
            .catch(error => {

                const data = {
                    error: "Load cart failed."
                };

                templateBuilder.append("error", data, "errors")
            })

    }

    loadCartPage()
    {
        const main = document.getElementById("main")
        main.innerHTML = "";

        let div = document.createElement("div");
        div.className = "filter-box";
        main.appendChild(div);

        const contentDiv = document.createElement("div")
        contentDiv.id = "content";
        contentDiv.classList.add("content-form");

        const cartHeader = document.createElement("div")
        cartHeader.classList.add("cart-header")

        const h1 = document.createElement("h1")
        h1.innerText = "Cart";
        cartHeader.appendChild(h1);

        const actionsDiv = document.createElement("div");
        actionsDiv.classList.add("cart-actions");

        const checkoutButton = document.createElement("button");
        checkoutButton.classList.add("btn", "btn-success");
        checkoutButton.innerText = "Checkout";
        checkoutButton.addEventListener("click", () => this.showCheckoutPage());
        actionsDiv.appendChild(checkoutButton);

        const button = document.createElement("button");
        button.classList.add("btn")
        button.classList.add("btn-danger")
        button.innerText = "Clear";
        button.addEventListener("click", () => this.clearCart());
        actionsDiv.appendChild(button)

        cartHeader.appendChild(actionsDiv);

        contentDiv.appendChild(cartHeader)
        main.appendChild(contentDiv);

        if(this.cart.items.length === 0)
        {
            checkoutButton.disabled = true;

            const emptyMsg = document.createElement("p");
            emptyMsg.classList.add("content-message");
            emptyMsg.innerText = "Your cart is empty.";
            contentDiv.appendChild(emptyMsg);
            return;
        }

        this.cart.items.forEach(item => {
            this.buildItem(item, contentDiv)
        });

        const totalDiv = document.createElement("div");
        totalDiv.classList.add("cart-total");
        totalDiv.innerText = `Total: $${this.cart.total.toFixed(2)}`;
        contentDiv.appendChild(totalDiv);

        this.loadRecommendations(contentDiv);
    }

    buildItem(item, parent)
    {
        let outerDiv = document.createElement("div");
        outerDiv.classList.add("cart-item");

        let div = document.createElement("div");
        outerDiv.appendChild(div);
        let h4 = document.createElement("h4")
        h4.innerText = item.product.name;
        div.appendChild(h4);

        let photoDiv = document.createElement("div");
        photoDiv.classList.add("photo")
        let img = document.createElement("img");
        img.src = `./images/products/${item.product.imageUrl}`
        img.addEventListener("click", () => {
            showImageDetailForm(item.product.name, img.src)
        })
        photoDiv.appendChild(img)
        let priceH4 = document.createElement("h4");
        priceH4.classList.add("price");
        priceH4.innerText = `$${Number(item.product.price).toFixed(2)}`;
        photoDiv.appendChild(priceH4);
        outerDiv.appendChild(photoDiv);

        if(item.discountPercent > 0)
        {
            let discountDiv = document.createElement("div");
            discountDiv.classList.add("cart-discount");
            discountDiv.innerText = `${Math.round(item.discountPercent * 100)}% off — line total $${Number(item.lineTotal).toFixed(2)}`;
            outerDiv.appendChild(discountDiv);
        }

        let descriptionDiv = document.createElement("div");
        descriptionDiv.innerText = item.product.description;
        outerDiv.appendChild(descriptionDiv);

        let quantityDiv = document.createElement("div");
        quantityDiv.classList.add("quantity-control");

        let quantityLabel = document.createElement("label");
        quantityLabel.innerText = "Quantity: ";
        quantityDiv.appendChild(quantityLabel);

        let quantityInput = document.createElement("input");
        quantityInput.type = "number";
        quantityInput.min = "1";
        if(item.product.stock) quantityInput.max = item.product.stock;
        quantityInput.value = item.quantity;
        quantityInput.classList.add("quantity-input");
        quantityInput.addEventListener("change", () => {
            let newQuantity = parseInt(quantityInput.value, 10);

            if(isNaN(newQuantity) || newQuantity < 1)
            {
                newQuantity = 1;
            }

            if(item.product.stock && newQuantity > item.product.stock)
            {
                newQuantity = item.product.stock;
                templateBuilder.append("error", { error: `Only ${item.product.stock} in stock.` }, "errors");
            }

            quantityInput.value = newQuantity;
            this.updateQuantity(item.product.productId, newQuantity);
        });
        quantityDiv.appendChild(quantityInput);

        let removeButton = document.createElement("button");
        removeButton.classList.add("btn", "btn-outline-danger", "btn-sm", "remove-item");
        removeButton.innerText = "Remove";
        removeButton.addEventListener("click", () => this.removeFromCart(item.product.productId));
        quantityDiv.appendChild(removeButton);

        outerDiv.appendChild(quantityDiv)


        parent.appendChild(outerDiv);
    }

    updateQuantity(productId, quantity)
    {
        const url = `${config.baseUrl}/cart/products/${productId}`;

        axios.put(url, { productId, quantity })
             .then(response => {
                 this.setCart(response.data);
                 this.updateCartDisplay();
                 this.loadCartPage();
             })
             .catch(error => {

                 const data = {
                     error: "Update quantity failed."
                 };

                 templateBuilder.append("error", data, "errors")
             })
    }

    removeFromCart(productId)
    {
        // The backend has no single-item delete; setting quantity to 0 removes it
        // from view (setCart filters out zero-quantity items).
        const url = `${config.baseUrl}/cart/products/${productId}`;

        axios.put(url, { productId, quantity: 0 })
             .then(response => {
                 this.setCart(response.data);
                 this.updateCartDisplay();
                 this.loadCartPage();
             })
             .catch(error => {

                 const data = {
                     error: "Remove item failed."
                 };

                 templateBuilder.append("error", data, "errors")
             })
    }

    loadRecommendations(parent)
    {
        if(this.cart.items.length === 0) return;

        const cartProductIds = this.cart.items.map(item => item.product.productId);
        const categoryId = this.cart.items[0].product.categoryId;

        if(!categoryId) return;

        const url = `${config.baseUrl}/products?cat=${categoryId}`;

        axios.get(url)
             .then(response => {
                 const recommended = response.data
                     .filter(product => !cartProductIds.includes(product.productId))
                     .slice(0, 4);

                 if(recommended.length === 0) return;

                 this.buildRecommendations(recommended, parent);
             })
             .catch(() => {
                 // Recommendations are non-critical; fail silently.
             });
    }

    buildRecommendations(products, parent)
    {
        const heading = document.createElement("h3");
        heading.classList.add("recommendations-heading");
        heading.innerText = "You might also like";
        parent.appendChild(heading);

        const strip = document.createElement("div");
        strip.classList.add("recommendations");

        products.forEach(product => {
            const imageUrl = productService.hasPhoto(product.imageUrl) ? product.imageUrl : "no-image.jpg";

            const card = document.createElement("div");
            card.classList.add("recommendation-card");

            const img = document.createElement("img");
            img.src = `./images/products/${imageUrl}`;
            card.appendChild(img);

            const name = document.createElement("h4");
            name.innerText = product.name;
            card.appendChild(name);

            const price = document.createElement("div");
            price.classList.add("price");
            price.innerText = `$${Number(product.price).toFixed(2)}`;
            card.appendChild(price);

            const addButton = document.createElement("button");
            addButton.classList.add("btn", "btn-success", "btn-sm");

            if(product.stock <= 0)
            {
                addButton.innerText = "Out of Stock";
                addButton.disabled = true;
            }
            else
            {
                addButton.innerText = "Add to Cart";
                addButton.addEventListener("click", () => {
                    this.addToCart(product.productId).then(() => this.loadCartPage());
                });
            }

            card.appendChild(addButton);

            strip.appendChild(card);
        });

        parent.appendChild(strip);
    }

    clearCart()
    {

        const url = `${config.baseUrl}/cart`;

        axios.delete(url)
             .then(response => {
                 this.cart = {
                     items: [],
                     total: 0
                 }

                 this.cart.total = response.data.total;

                 for (const [key, value] of Object.entries(response.data.items)) {
                     this.cart.items.push(value);
                 }

                 this.updateCartDisplay()
                 this.loadCartPage()

             })
             .catch(error => {

                 const data = {
                     error: "Empty cart failed."
                 };

                 templateBuilder.append("error", data, "errors")
             })
    }

    showCheckoutPage()
    {
        if(this.cart.items.length === 0)
        {
            templateBuilder.append("error", { error: "Your cart is empty." }, "errors");
            return;
        }

        const main = document.getElementById("main");
        main.innerHTML = "";

        const filler = document.createElement("div");
        filler.className = "filter-box";
        main.appendChild(filler);

        const contentDiv = document.createElement("div");
        contentDiv.id = "content";
        contentDiv.classList.add("content-form");

        const h1 = document.createElement("h1");
        h1.innerText = "Checkout";
        contentDiv.appendChild(h1);

        const notice = document.createElement("div");
        notice.classList.add("demo-notice");
        notice.innerText = "Demo only — this is not a real payment. Do not enter real card numbers.";
        contentDiv.appendChild(notice);

        // Order summary
        const summaryHeading = document.createElement("h3");
        summaryHeading.innerText = "Order Summary";
        contentDiv.appendChild(summaryHeading);

        const summary = document.createElement("div");
        summary.classList.add("checkout-summary");
        this.renderSummaryRows(summary, this.cart.items.map(i => this.normalizeItem(i)), this.cart.total);
        contentDiv.appendChild(summary);

        // Payment form
        const formHeading = document.createElement("h3");
        formHeading.innerText = "Payment Details";
        contentDiv.appendChild(formHeading);

        const nameInput = this.buildCheckoutField(contentDiv, "Cardholder Name", "Name on card");
        const cardInput = this.buildCheckoutField(contentDiv, "Card Number", "1234 5678 9012 3456");
        cardInput.maxLength = 19;
        cardInput.addEventListener("input", () => {
            const digits = cardInput.value.replace(/\D/g, "").slice(0, 16);
            cardInput.value = digits.replace(/(.{4})/g, "$1 ").trim();
        });

        const expInput = this.buildCheckoutField(contentDiv, "Expiry (MM/YY)", "MM/YY");
        expInput.maxLength = 5;
        expInput.addEventListener("input", () => {
            let digits = expInput.value.replace(/\D/g, "").slice(0, 4);
            if(digits.length >= 3) digits = digits.slice(0, 2) + "/" + digits.slice(2);
            expInput.value = digits;
        });

        const cvvInput = this.buildCheckoutField(contentDiv, "CVV", "123");
        cvvInput.maxLength = 4;
        cvvInput.addEventListener("input", () => {
            cvvInput.value = cvvInput.value.replace(/\D/g, "").slice(0, 4);
        });

        // Actions
        const actions = document.createElement("div");
        actions.classList.add("cart-actions");

        const placeButton = document.createElement("button");
        placeButton.classList.add("btn", "btn-success");
        placeButton.innerText = "Place Order";
        placeButton.addEventListener("click", () => {
            this.placeOrder({
                name: nameInput.value,
                number: cardInput.value,
                expiry: expInput.value,
                cvv: cvvInput.value
            });
        });
        actions.appendChild(placeButton);

        const backButton = document.createElement("button");
        backButton.classList.add("btn", "btn-secondary");
        backButton.innerText = "Back to Cart";
        backButton.addEventListener("click", () => this.loadCartPage());
        actions.appendChild(backButton);

        contentDiv.appendChild(actions);
        main.appendChild(contentDiv);
    }

    buildCheckoutField(parent, labelText, placeholder)
    {
        const wrapper = document.createElement("div");
        wrapper.classList.add("form-floating", "mb-3");

        const input = document.createElement("input");
        input.type = "text";
        input.classList.add("form-control");
        input.placeholder = placeholder || labelText;
        wrapper.appendChild(input);

        const label = document.createElement("label");
        label.innerText = labelText;
        wrapper.appendChild(label);

        parent.appendChild(wrapper);
        return input;
    }

    summaryRow(labelText, valueText, isTotal)
    {
        const row = document.createElement("div");
        row.classList.add("summary-row");
        if(isTotal) row.classList.add("summary-total");

        const label = document.createElement("span");
        label.innerText = labelText;
        const value = document.createElement("span");
        value.innerText = valueText;

        row.appendChild(label);
        row.appendChild(value);
        return row;
    }

    // items: [{ name, price, quantity, discountPercent, lineTotal }]
    renderSummaryRows(container, items, total)
    {
        let subtotal = 0;
        let discountTotal = 0;

        items.forEach(item => {
            const lineSubtotal = item.price * item.quantity;
            const lineTotal = item.lineTotal !== undefined ? item.lineTotal : lineSubtotal;

            subtotal += lineSubtotal;
            discountTotal += (lineSubtotal - lineTotal);

            let label = `${item.name} × ${item.quantity}`;
            if(item.discountPercent > 0)
            {
                label += ` (−${Math.round(item.discountPercent * 100)}% off)`;
            }

            container.appendChild(this.summaryRow(label, `$${lineTotal.toFixed(2)}`));
        });

        if(discountTotal > 0.001)
        {
            container.appendChild(this.summaryRow("Subtotal", `$${subtotal.toFixed(2)}`));
            container.appendChild(this.summaryRow("Discount", `−$${discountTotal.toFixed(2)}`));
        }

        container.appendChild(this.summaryRow("Total", `$${total.toFixed(2)}`, true));
    }

    // Normalize a live cart item into the shape renderSummaryRows expects.
    normalizeItem(item)
    {
        const price = Number(item.product.price);
        return {
            name: item.product.name,
            price: price,
            quantity: item.quantity,
            discountPercent: item.discountPercent || 0,
            lineTotal: item.lineTotal !== undefined ? Number(item.lineTotal) : price * item.quantity
        };
    }

    validateCard(card)
    {
        const errors = [];

        if(!card.name.trim()) errors.push("Cardholder name is required.");

        const digits = card.number.replace(/\s+/g, "");
        if(!/^\d{13,16}$/.test(digits)) errors.push("Card number must be 13–16 digits.");

        if(!/^\d{2}\/\d{2}$/.test(card.expiry))
        {
            errors.push("Expiry must be in MM/YY format.");
        }
        else
        {
            const month = parseInt(card.expiry.slice(0, 2), 10);
            if(month < 1 || month > 12) errors.push("Expiry month must be 01–12.");
        }

        if(!/^\d{3,4}$/.test(card.cvv)) errors.push("CVV must be 3–4 digits.");

        return errors;
    }

    placeOrder(card)
    {
        const errors = this.validateCard(card);
        if(errors.length > 0)
        {
            errors.forEach(e => templateBuilder.append("error", { error: e }, "errors"));
            return;
        }

        // Snapshot the cart for the receipt — the backend clears it on checkout
        // and doesn't return line items.
        const snapshot = {
            items: this.cart.items.map(i => this.normalizeItem(i)),
            total: this.cart.total
        };
        const cardLast4 = card.number.replace(/\s+/g, "").slice(-4);

        const url = `${config.baseUrl}/orders`;

        axios.post(url, {})
             .then(response => {
                 this.cart = { items: [], total: 0 };
                 this.updateCartDisplay();
                 this.showReceipt(response.data, snapshot, cardLast4);
             })
             .catch(error => {

                 const data = {
                     error: "Checkout failed."
                 };

                 templateBuilder.append("error", data, "errors")
             })
    }

    showReceipt(order, snapshot, cardLast4)
    {
        const main = document.getElementById("main");
        main.innerHTML = "";

        const filler = document.createElement("div");
        filler.className = "filter-box";
        main.appendChild(filler);

        const contentDiv = document.createElement("div");
        contentDiv.id = "content";
        contentDiv.classList.add("content-form");

        const h1 = document.createElement("h1");
        h1.innerText = "Order Confirmed";
        contentDiv.appendChild(h1);

        const thanks = document.createElement("p");
        thanks.innerText = "Thank you for your order! Your receipt is below.";
        contentDiv.appendChild(thanks);

        const receipt = document.createElement("div");
        receipt.classList.add("receipt");

        const meta = document.createElement("div");
        meta.classList.add("receipt-meta");
        if(order && order.orderId) meta.appendChild(this.receiptLine("Order #", order.orderId));
        if(order && order.date) meta.appendChild(this.receiptLine("Date", new Date(order.date).toLocaleString()));
        meta.appendChild(this.receiptLine("Paid with", `Card ending ${cardLast4}`));
        if(order && order.address)
        {
            const ship = [order.address, order.city, order.state, order.zip].filter(Boolean).join(", ");
            if(ship) meta.appendChild(this.receiptLine("Ship to", ship));
        }
        receipt.appendChild(meta);

        const itemsDiv = document.createElement("div");
        itemsDiv.classList.add("receipt-items");
        this.renderSummaryRows(itemsDiv, snapshot.items, snapshot.total);
        receipt.appendChild(itemsDiv);

        contentDiv.appendChild(receipt);

        const continueBtn = document.createElement("button");
        continueBtn.classList.add("btn", "btn-success");
        continueBtn.innerText = "Continue Shopping";
        continueBtn.addEventListener("click", () => loadHome());
        contentDiv.appendChild(continueBtn);

        main.appendChild(contentDiv);
    }

    receiptLine(label, value)
    {
        const div = document.createElement("div");
        div.classList.add("receipt-line");

        const l = document.createElement("span");
        l.classList.add("receipt-label");
        l.innerText = label;

        const v = document.createElement("span");
        v.innerText = value;

        div.appendChild(l);
        div.appendChild(v);
        return div;
    }

    updateCartDisplay()
    {
        try {
            const itemCount = this.cart.items.reduce((sum, item) => sum + item.quantity, 0);
            const cartControl = document.getElementById("cart-items")

            cartControl.innerText = itemCount;
        }
        catch (e) {

        }
    }
}





document.addEventListener('DOMContentLoaded', () => {
    cartService = new ShoppingCartService();

    if(userService.isLoggedIn())
    {
        cartService.loadCart();
    }

});
