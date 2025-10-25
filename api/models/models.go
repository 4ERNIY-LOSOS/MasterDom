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

type OfferResponse struct {
	ID              string    `json:"id"`
	Title           string    `json:"title"`
	Description     string    `json:"description"`
	OfferType       string    `json:"offerType"`
	CreatedAt       time.Time `json:"createdAt"`
	AuthorID        string    `json:"authorId"`
	AuthorFirstName string    `json:"authorFirstName"`
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
	IsAdmin bool   `json:"isAdmin"`
	jwt.RegisteredClaims
}
