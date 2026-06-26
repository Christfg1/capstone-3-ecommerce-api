package org.yearup.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.yearup.models.*;
import org.yearup.repository.OrderLineItemRepository;
import org.yearup.repository.OrderRepository;

import java.time.LocalDateTime;

@Service
public class OrderService
{
    private final OrderRepository orderRepository;
    private final OrderLineItemRepository orderLineItemRepository;
    private final ShoppingCartService shoppingCartService;
    private final ProfileService profileService;

    public OrderService(OrderRepository orderRepository,
                        OrderLineItemRepository orderLineItemRepository,
                        ShoppingCartService shoppingCartService,
                        ProfileService profileService)
    {
        this.orderRepository = orderRepository;
        this.orderLineItemRepository = orderLineItemRepository;
        this.shoppingCartService = shoppingCartService;
        this.profileService = profileService;
    }

    /*
        It converts the logged-in user's shopping cart into a saved order.
        The method is transactional because all checkout steps should succeed together.

        If creating the order or any order line item fails, the transaction can roll back
        instead of leaving the database with a partial checkout.
     */
    @Transactional
    public Order checkout(int userId)
    {
        // Load the current user's shopping cart from the database.
        ShoppingCart cart = shoppingCartService.getByUserId(userId);

        // Prevent checkout if the user has no items in the cart.
        if (cart.getItems().isEmpty())
        {
            return null;
        }

        // Get the user's profile so we can copy shipping information into the order.
        Profile profile = profileService.getByUserId(userId);

        // Create the main order record.
        Order order = new Order();
        order.setUserId(userId);
        order.setDate(LocalDateTime.now());
        order.setShippingAmount(0);

        // If the user has profile information, save the shipping details with the order.
        if (profile != null)
        {
            order.setAddress(profile.getAddress());
            order.setCity(profile.getCity());
            order.setState(profile.getState());
            order.setZip(profile.getZip());
        }

        /*
            Save the order first.

            This is important because the database generates the orderId.
            The orderId is then needed when creating the order line items.
         */
        Order savedOrder = orderRepository.save(order);

        /*
            Convert each shopping cart item into an order line item.

            The order line item stores:
            - which order it belongs to
            - which product was purchased
            - the product price at checkout time
            - the quantity purchased
            - any discount applied
         */
        for (ShoppingCartItem cartItem : cart.getItems().values())
        {
            Product product = cartItem.getProduct();

            OrderLineItem lineItem = new OrderLineItem();
            lineItem.setOrderId(savedOrder.getOrderId());
            lineItem.setProductId(product.getProductId());
            lineItem.setSalesPrice(product.getPrice());
            lineItem.setQuantity(cartItem.getQuantity());
            lineItem.setDiscount(cartItem.getDiscountPercent());

            orderLineItemRepository.save(lineItem);
        }

        // After a successful checkout, clear the user's shopping cart.
        shoppingCartService.clearCart(userId);

        // Return the completed order to the controller.
        return savedOrder;
    }
}