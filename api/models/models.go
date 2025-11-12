package models

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type RegisterPayload struct {
	Email       string  `json:"email" binding:"required,email"`
	Password    string  `json:"password" binding:"required,min=8"`
	FirstName   string  `json:"firstName" binding:"required"`
	LastName    *string `json:"lastName"`
	PhoneNumber *string `json:"phoneNumber"`
}

type LoginPayload struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type CreateOfferPayload struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	CategoryID  *int   `json:"categoryId"`
	OfferType   string `json:"offerType" binding:"required,oneof=request_for_service service_offer"`
}

type UpdateOfferPayload struct {
	IsActive *bool `json:"isActive"`
}

type CategoryPayload struct {
	Name        string  `json:"name" binding:"required"`
	Description *string `json:"description"`
}

type Offer struct {
	ID          string    `json:"id"`
	AuthorID    string    `json:"authorId"`
	OfferType   string    `json:"offerType" binding:"required,oneof=service_offer request_for_service"`
	Title       string    `json:"title" binding:"required"`
	Description string    `json:"description"`
	CategoryID  int       `json:"categoryId" binding:"required"`
	IsActive    bool      `json:"isActive"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// OfferApplication представляет отклик пользователя на объявление
type OfferApplication struct {
	ID                 string    `json:"id"`
	OfferID            string    `json:"offerId"`
	ApplicantID        string    `json:"applicantId"`
	Message            string    `json:"message"`
	Status             string    `json:"status"`
	CreatedAt          time.Time `json:"createdAt"`
	UpdatedAt          time.Time `json:"updatedAt"`
	ApplicantFirstName string    `json:"applicantFirstName,omitempty"`
	ApplicantRating    float32   `json:"applicantRating,omitempty"`
}

// RespondToOfferPayload представляет тело запроса при отклике на объявление
type RespondToOfferPayload struct {
	Message string `json:"message"`
}

// OfferResponse используется для отображения списка объявлений с информацией об авторе
type OfferResponse struct {
	ID              string    `json:"id"`
	Title           string    `json:"title"`
	Description     string    `json:"description"`
	OfferType       string    `json:"offerType"`
	CreatedAt       time.Time `json:"createdAt"`
	AuthorID        string    `json:"authorId"`
	AuthorFirstName string    `json:"authorFirstName"`
	HasResponded    bool      `json:"hasResponded"`
}

type Job struct {
	ID          string    `json:"id"`
	OfferID     string    `json:"offerId"`
	ClientID    string    `json:"clientId"`
	MasterID    string    `json:"masterId"`
	Status      string    `json:"status"`
	ScheduledFor *time.Time `json:"scheduledFor"`
	StartedAt   *time.Time `json:"startedAt"`
	CompletedAt *time.Time `json:"completedAt"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type AdminOfferResponse struct {
	ID              string    `json:"id"`
	Title           string    `json:"title"`
	Description     string    `json:"description"`
	OfferType       string    `json:"offerType"`
	IsActive        bool      `json:"isActive"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
	AuthorID        string    `json:"authorId"`
	AuthorFirstName string    `json:"authorFirstName"`
	AuthorEmail     string    `json:"authorEmail"`
}

type UserDetail struct {
	ID                string    `json:"id"`
	Email             string    `json:"email"`
	Role              string    `json:"role"`
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
	FirstName         *string   `json:"firstName"`
	LastName          *string   `json:"lastName"`
	PhoneNumber       *string   `json:"phoneNumber"`
	Bio               *string   `json:"bio"`
	YearsOfExperience *int      `json:"yearsOfExperience"`
	AverageRating     *float64  `json:"averageRating"`
}

type UpdateUserPayload struct {
	FirstName         *string `json:"firstName"`
	LastName          *string `json:"lastName"`
	PhoneNumber       *string `json:"phoneNumber"`
	Bio               *string `json:"bio"`
	YearsOfExperience *int    `json:"yearsOfExperience"`
	IsAdmin           *bool   `json:"isAdmin"` // This will now update the 'role' column
}

type AdminStats struct {
	TotalUsers           int `json:"totalUsers"`
	TotalOffers          int `json:"totalOffers"`
	TotalJobs            int `json:"totalJobs"`
	TotalServiceRequests int `json:"totalServiceRequests"`
	TotalServiceOffers   int `json:"totalServiceOffers"`
}

type User struct {
	ID           string
	Email        string
	PasswordHash string
	Role         string
}

type ServiceCategory struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type Claims struct {
	UserID  string `json:"userId"`
	Email   string `json:"email"`
	IsAdmin bool   `json:"isAdmin"`
	jwt.RegisteredClaims
}

// --- Chat Models ---

type Conversation struct {
	ID        string    `json:"id"`
	OfferID   string    `json:"offerId"`
	CreatedAt time.Time `json:"createdAt"`
}

type ConversationParticipant struct {
	ConversationID string `json:"conversationId"`
	UserID         string `json:"userId"`
}

type Message struct {
	ID             string    `json:"id"`
	ConversationID string    `json:"conversationId"`
	SenderID       string    `json:"senderId"`
	Content        string    `json:"content"`
	CreatedAt      time.Time `json:"createdAt"`
	IsRead         bool      `json:"isRead"`
}

// InitiateChatPayload является телом запроса для создания чата
type InitiateChatPayload struct {
	OfferID     string `json:"offerId" binding:"required"`
	RecipientID string `json:"recipientId" binding:"required"`
}

// SendMessagePayload является телом запроса для отправки сообщения
type SendMessagePayload struct {
	Content string `json:"content" binding:"required"`
}

// MessageResponse используется для отображения сообщения с информацией об отправителе
type MessageResponse struct {
	ID              string    `json:"id"`
	ConversationID  string    `json:"conversationId"`
	SenderID        string    `json:"senderId"`
	SenderFirstName string    `json:"senderFirstName"`
	Content         string    `json:"content"`
	CreatedAt       time.Time `json:"createdAt"`
	IsRead          bool      `json:"isRead"`
}

// ChatDetailsResponse используется для отображения деталей чата
type ChatDetailsResponse struct {
	ConversationID string       `json:"conversationId"`
	OfferTitle     string       `json:"offerTitle"`
	OfferID        string       `json:"offerId"`
	Participants   []UserDetail `json:"participants"`
}

// ConversationPreview используется для отображения списка чатов
type ConversationPreview struct {
	ConversationID       string    `json:"conversationId"`
	OtherParticipantID   string    `json:"otherParticipantId"`
	OtherParticipantName string    `json:"otherParticipantName"`
	LastMessageContent   string    `json:"lastMessageContent"`
	LastMessageAt        time.Time `json:"lastMessageAt"`
	OfferTitle           string    `json:"offerTitle"`
}
