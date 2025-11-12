package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"masterdom/api/models"
	"masterdom/api/store"
	"masterdom/api/utils"
)

type Handler struct {
	Store store.Store
}

func NewHandler(s store.Store) *Handler {
	return &Handler{Store: s}
}

func (h *Handler) Register(c *gin.Context) {
	var payload models.RegisterPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input", "details": err.Error()})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(payload.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to hash password"})
		return
	}

	userID, err := h.Store.CreateUser(c.Request.Context(), payload, string(hashedPassword))
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to register user", "details": err.Error()})
		return
	}

	c.JSON(201, gin.H{"message": "User registered successfully", "userId": userID})
}

func (h *Handler) Login(c *gin.Context) {
	var payload models.LoginPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input"})
		return
	}

	user, err := h.Store.GetUserByEmail(c.Request.Context(), payload.Email)
	if err != nil {
		c.JSON(401, gin.H{"error": "Invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(payload.Password)); err != nil {
		c.JSON(401, gin.H{"error": "Invalid credentials"})
		return
	}

	isAdmin := user.Role == "admin"

	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &models.Claims{
		UserID:  user.ID,
		Email:   user.Email,
		IsAdmin: isAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(utils.GetJWTKey())
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to create token"})
		return
	}

	c.JSON(200, gin.H{"token": tokenString, "isAdmin": isAdmin})
}

// ... other handlers are mostly fine, just ensure they call the correct store methods ...

func (h *Handler) CreateOffer(c *gin.Context) {
	var payload models.CreateOfferPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input", "details": err.Error()})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	offerID, err := h.Store.CreateOffer(c.Request.Context(), userID.(string), payload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create offer", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"offerId": offerID})
}

func (h *Handler) RespondToOffer(c *gin.Context) {
	offerID := c.Param("id")
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var payload models.RespondToOfferPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	response := models.OfferApplication{
		OfferID:     offerID,
		ApplicantID: userID.(string),
		Message:     payload.Message,
	}

	responseID, err := h.Store.CreateOfferResponse(c.Request.Context(), &response)
	if err != nil {
		if err.Error() == "response already exists" {
			c.JSON(http.StatusConflict, gin.H{"error": "You have already responded to this offer"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create offer response", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"responseId": responseID})
}

func (h *Handler) GetOfferApplications(c *gin.Context) {
	offerID := c.Param("id")
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Verify that the current user is the author of the offer
	authorID, err := h.Store.GetOfferAuthor(c.Request.Context(), offerID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Offer not found"})
		return
	}
	if authorID != userID.(string) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not authorized to view applications for this offer"})
		return
	}

	applications, err := h.Store.GetOfferApplications(c.Request.Context(), offerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch offer applications", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, applications)
}

func (h *Handler) GetOffers(c *gin.Context) {
	offerType := c.Query("type")
	search := c.Query("search")
	category := c.Query("category")

	// userID может быть nil, если пользователь не аутентифицирован
	var userID *string
	if id, exists := c.Get("userID"); exists {
		idStr := id.(string)
		userID = &idStr
	}

	offers, err := h.Store.GetOffers(c.Request.Context(), offerType, search, category, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch offers", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, offers)
}
func (h *Handler) GetUsers(c *gin.Context) {
	users, err := h.Store.GetAllUsers(c.Request.Context())
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch users", "details": err.Error()})
		return
	}
	c.JSON(200, users)
}

func (h *Handler) GetUserByID(c *gin.Context) {
	userID := c.Param("id")
	user, err := h.Store.GetUserDetailByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(404, gin.H{"error": "User not found", "details": err.Error()})
		return
	}
	c.JSON(200, user)
}

func (h *Handler) UpdateUser(c *gin.Context) {
	userID := c.Param("id")
	var payload models.UpdateUserPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input", "details": err.Error()})
		return
	}

	// If a role change is requested (demotion)
	if payload.IsAdmin != nil && !*payload.IsAdmin {
		// Get the ID of the admin making the request from the token
		loggedInUserID, exists := c.Get("userID")
		if !exists {
			c.JSON(401, gin.H{"error": "Unauthorized"})
			return
		}

		// Prevent an admin from demoting themselves
		if loggedInUserID.(string) == userID {
			c.JSON(403, gin.H{"error": "Cannot remove admin rights from yourself"})
			return
		}

		// Check if the user making the request is the super admin
		loggedInUserEmail, err := h.Store.GetUserEmailByID(c.Request.Context(), loggedInUserID.(string))
		if err != nil {
			c.JSON(500, gin.H{"error": "Could not verify requesting user's identity"})
			return
		}

		// Only the super admin can demote other admins
		if loggedInUserEmail != "admin@gmail.com" {
			// Check if the target user is currently an admin
			isTargetAdmin, err := h.Store.IsUserAdmin(c.Request.Context(), userID)
			if err != nil {
				c.JSON(500, gin.H{"error": "Could not check target user status"})
				return
			}
			if isTargetAdmin {
				c.JSON(403, gin.H{"error": "Forbidden: Only the super admin can demote other administrators"})
				return
			}
		}
	}

	err := h.Store.UpdateUserDetail(c.Request.Context(), userID, payload)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to update user", "details": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "User updated successfully"})
}

func (h *Handler) DeleteUser(c *gin.Context) {
	userID := c.Param("id")

	isTargetAdmin, err := h.Store.IsUserAdmin(c.Request.Context(), userID)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to check target user admin status", "details": err.Error()})
		return
	}
	if isTargetAdmin {
		c.JSON(403, gin.H{"error": "Cannot delete an administrator"})
		return
	}

	err = h.Store.DeleteUser(c.Request.Context(), userID)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to delete user", "details": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "User deleted successfully"})
}

func (h *Handler) GetAdminAllOffers(c *gin.Context) {
	offers, err := h.Store.GetAllOffersForAdmin(c.Request.Context())
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch offers for admin", "details": err.Error()})
		return
	}
	c.JSON(200, offers)
}

func (h *Handler) UpdateOfferStatus(c *gin.Context) {
	offerID := c.Param("id")
	var payload models.UpdateOfferPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input", "details": err.Error()})
		return
	}

	if payload.IsActive == nil {
		c.JSON(400, gin.H{"error": "isActive field is required"})
		return
	}

	err := h.Store.UpdateOfferStatus(c.Request.Context(), offerID, payload)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to update offer status", "details": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "Offer status updated successfully"})
}

func (h *Handler) DeleteOffer(c *gin.Context) {
	offerID := c.Param("id")
	err := h.Store.DeleteOffer(c.Request.Context(), offerID)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to delete offer", "details": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "Offer deleted successfully"})
}

func (h *Handler) GetAllCategories(c *gin.Context) {
	categories, err := h.Store.GetAllCategories(c.Request.Context())
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to fetch categories", "details": err.Error()})
		return
	}
	c.JSON(200, categories)
}

func (h *Handler) CreateCategory(c *gin.Context) {
	var payload models.CategoryPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input", "details": err.Error()})
		return
	}

	categoryID, err := h.Store.CreateCategory(c.Request.Context(), payload)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to create category", "details": err.Error()})
		return
	}

	c.JSON(201, gin.H{"message": "Category created successfully", "categoryId": categoryID})
}

func (h *Handler) UpdateCategory(c *gin.Context) {
	categoryID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid category ID"})
		return
	}

	var payload models.CategoryPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input", "details": err.Error()})
		return
	}

	err = h.Store.UpdateCategory(c.Request.Context(), categoryID, payload)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to update category", "details": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "Category updated successfully"})
}

func (h *Handler) DeleteCategory(c *gin.Context) {
	categoryID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid category ID"})
		return
	}

	err = h.Store.DeleteCategory(c.Request.Context(), categoryID)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to delete category", "details": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "Category deleted successfully"})
}

func (h *Handler) GetAdminStats(c *gin.Context) {
	stats, err := h.Store.GetAdminStats(c.Request.Context())
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to get admin stats", "details": err.Error()})
		return
	}
	c.JSON(200, stats)
}

func (h *Handler) GetMyProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	user, err := h.Store.GetUserDetailByID(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(404, gin.H{"error": "User not found", "details": err.Error()})
		return
	}
	c.JSON(200, user)
}

func (h *Handler) UpdateMyProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	var payload models.UpdateUserPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(400, gin.H{"error": "Invalid input", "details": err.Error()})
		return
	}

	// Prevent user from making themselves an admin
	payload.IsAdmin = nil

	err := h.Store.UpdateUserDetail(c.Request.Context(), userID.(string), payload)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to update profile", "details": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "Profile updated successfully"})
}

// --- Chat Handlers ---

func (h *Handler) InitiateChat(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var payload models.InitiateChatPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input", "details": err.Error()})
		return
	}

	// Ensure user is not trying to start a chat with themselves
	if userID.(string) == payload.RecipientID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot start a chat with yourself"})
		return
	}

	conversationID, err := h.Store.InitiateChat(c.Request.Context(), payload.OfferID, userID.(string), payload.RecipientID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to initiate chat", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"conversationId": conversationID})
}

func (h *Handler) GetChatDetails(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	conversationID := c.Param("id")
	if conversationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Conversation ID is required"})
		return
	}

	details, err := h.Store.GetChatDetails(c.Request.Context(), conversationID, userID.(string))
	if err != nil {
		// Check for specific "not a participant" error to return a 403
		if err.Error() == "user is not a participant in this conversation" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get chat details", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, details)
}

func (h *Handler) GetMessages(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	conversationID := c.Param("id")
	if conversationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Conversation ID is required"})
		return
	}

	messages, err := h.Store.GetMessages(c.Request.Context(), conversationID, userID.(string))
	if err != nil {
		if err.Error() == "user is not a participant in this conversation" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get messages", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, messages)
}

func (h *Handler) PostMessage(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	conversationID := c.Param("id")
	if conversationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Conversation ID is required"})
		return
	}

	var payload models.SendMessagePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input", "details": err.Error()})
		return
	}

	// Here you might add a check to ensure the user is a participant before posting.
	// The store method already does this, but an early check can be good.

	message, err := h.Store.PostMessage(c.Request.Context(), conversationID, userID.(string), payload.Content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to post message", "details": err.Error()})
		return
	}

	// TODO: Broadcast message via WebSocket to other participants

	c.JSON(http.StatusCreated, message)
}

func (h *Handler) GetConversations(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	conversations, err := h.Store.GetConversations(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get conversations", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, conversations)
}


