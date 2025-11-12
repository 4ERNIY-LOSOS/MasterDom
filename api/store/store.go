package store

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"

	"masterdom/api/models"
)

type Store interface {
	CreateUser(ctx context.Context, payload models.RegisterPayload, hashedPassword string) (string, error)
	GetUserByEmail(ctx context.Context, email string) (*models.User, error)
	CreateOffer(ctx context.Context, userID string, payload models.CreateOfferPayload) (string, error)
	GetOffers(ctx context.Context, offerTypeFilter string, search string, categoryID string, userID *string) ([]models.OfferResponse, error)
	GetAllUsers(ctx context.Context) ([]models.UserDetail, error)
	GetUserDetailByID(ctx context.Context, userID string) (*models.UserDetail, error)
	UpdateUserDetail(ctx context.Context, userID string, payload models.UpdateUserPayload) error
	DeleteUser(ctx context.Context, userID string) error
	IsUserAdmin(ctx context.Context, userID string) (bool, error)
	GetUserEmailByID(ctx context.Context, userID string) (string, error)
	GetAllOffersForAdmin(ctx context.Context) ([]models.AdminOfferResponse, error)
	UpdateOfferStatus(ctx context.Context, offerID string, payload models.UpdateOfferPayload) error
	DeleteOffer(ctx context.Context, offerID string) error
	GetAllCategories(ctx context.Context) ([]models.ServiceCategory, error)
	CreateCategory(ctx context.Context, payload models.CategoryPayload) (int, error)
	UpdateCategory(ctx context.Context, categoryID int, payload models.CategoryPayload) error
	DeleteCategory(ctx context.Context, categoryID int) error
	GetAdminStats(ctx context.Context) (*models.AdminStats, error)
	CreateOfferResponse(ctx context.Context, response *models.OfferApplication) (string, error)
	GetOfferApplications(ctx context.Context, offerID string) ([]models.OfferApplication, error)
	GetOfferAuthor(ctx context.Context, offerID string) (string, error)

	// Chat methods
	InitiateChat(ctx context.Context, offerID, initiatorID, recipientID string) (string, error)
	GetChatDetails(ctx context.Context, conversationID, userID string) (*models.ChatDetailsResponse, error)
	PostMessage(ctx context.Context, conversationID, senderID, content string) (*models.MessageResponse, error)
	GetMessages(ctx context.Context, conversationID, userID string) ([]models.MessageResponse, error)
	GetConversations(ctx context.Context, userID string) ([]models.ConversationPreview, error)
}

type PostgresStore struct {
	dbpool *pgxpool.Pool
}

func NewPostgresStore(dbpool *pgxpool.Pool) *PostgresStore {
	return &PostgresStore{dbpool: dbpool}
}

func (s *PostgresStore) CreateUser(ctx context.Context, payload models.RegisterPayload, hashedPassword string) (string, error) {
	tx, err := s.dbpool.Begin(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	var userID string
	err = tx.QueryRow(ctx,
		"INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'user') RETURNING id",
		payload.Email, hashedPassword).Scan(&userID)
	if err != nil {
		return "", fmt.Errorf("failed to create user: %w", err)
	}

	_, err = tx.Exec(ctx,
		"INSERT INTO user_details (user_id, first_name, last_name, phone_number) VALUES ($1, $2, $3, $4)",
		userID, payload.FirstName, payload.LastName, payload.PhoneNumber)
	if err != nil {
		return "", fmt.Errorf("failed to create user_details: %w", err)
	}

	return userID, tx.Commit(ctx)
}

func (s *PostgresStore) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	err := s.dbpool.QueryRow(ctx,
		"SELECT id, email, password_hash, role FROM users WHERE email = $1",
		email).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Role)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}
	return &user, nil
}

func (s *PostgresStore) GetOffers(ctx context.Context, offerTypeFilter string, search string, categoryID string, userID *string) ([]models.OfferResponse, error) {
	baseQuery := `
		SELECT o.id, o.title, o.description, o.offer_type, o.created_at,
			   u.id as author_id,
			   up.first_name as author_first_name,
			   CASE WHEN $1::UUID IS NOT NULL THEN EXISTS (
				   SELECT 1 FROM offer_responses orr WHERE orr.offer_id = o.id AND orr.applicant_id = $1::UUID
			   ) ELSE FALSE END as has_responded
		FROM offers o
		JOIN users u ON o.author_id = u.id
		LEFT JOIN user_details up ON u.id = up.user_id
		WHERE o.is_active = true`

	args := []interface{}{userID}
	whereClauses := []string{}
	argCount := 2 // Start at 2 because $1 is for userID

	if offerTypeFilter != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("o.offer_type = $%d", argCount))
		args = append(args, offerTypeFilter)
		argCount++
	}

	if search != "" {
		// Use separate placeholders for title and description search
		whereClauses = append(whereClauses, fmt.Sprintf("(LOWER(o.title) LIKE $%d OR LOWER(o.description) LIKE $%d)", argCount, argCount+1))
		args = append(args, "%"+strings.ToLower(search)+"%", "%"+strings.ToLower(search)+"%")
		argCount += 2
	}

	if categoryID != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("o.category_id = $%d", argCount))
		args = append(args, categoryID)
		argCount++
	}

	if len(whereClauses) > 0 {
		baseQuery += " AND " + strings.Join(whereClauses, " AND ")
	}

	baseQuery += " ORDER BY o.created_at DESC"

	rows, err := s.dbpool.Query(ctx, baseQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch offers: %w", err)
	}
	defer rows.Close()

	offers := make([]models.OfferResponse, 0)
	for rows.Next() {
		var offer models.OfferResponse
		if err := rows.Scan(&offer.ID, &offer.Title, &offer.Description, &offer.OfferType, &offer.CreatedAt, &offer.AuthorID, &offer.AuthorFirstName, &offer.HasResponded); err != nil {
			log.Printf("Error scanning offer row: %v", err)
			continue
		}
		offers = append(offers, offer)
	}
	return offers, nil
}

func (s *PostgresStore) IsUserAdmin(ctx context.Context, userID string) (bool, error) {
	var role string
	err := s.dbpool.QueryRow(ctx, "SELECT role FROM users WHERE id = $1", userID).Scan(&role)
	if err != nil {
		return false, nil
	}
	return role == "admin", nil
}

// ... Implementations for all other interface methods ...

func (s *PostgresStore) CreateOffer(ctx context.Context, userID string, payload models.CreateOfferPayload) (string, error) {
	var offerID string
	err := s.dbpool.QueryRow(ctx,
		`INSERT INTO offers (author_id, offer_type, title, description, category_id)
		 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
		userID, payload.OfferType, payload.Title, payload.Description, payload.CategoryID).Scan(&offerID)

	if err != nil {
		return "", fmt.Errorf("failed to create offer: %w", err)
	}
	return offerID, nil
}

func (s *PostgresStore) GetAllUsers(ctx context.Context) ([]models.UserDetail, error) {
	rows, err := s.dbpool.Query(ctx,
		`SELECT u.id, u.email, u.role, u.created_at, u.updated_at, 
				up.first_name, up.last_name, up.phone_number, up.bio, up.years_of_experience, up.average_rating
		 FROM users u
		 LEFT JOIN user_details up ON u.id = up.user_id
		 ORDER BY u.created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch all users: %w", err)
	}
	defer rows.Close()

	users := make([]models.UserDetail, 0)
	for rows.Next() {
		var user models.UserDetail
		if err := rows.Scan(
			&user.ID, &user.Email, &user.Role, &user.CreatedAt, &user.UpdatedAt,
			&user.FirstName, &user.LastName, &user.PhoneNumber, &user.Bio, &user.YearsOfExperience, &user.AverageRating);
			err != nil {
			return nil, fmt.Errorf("failed to scan user detail: %w", err)
		}
		users = append(users, user)
	}
	return users, nil
}

func (s *PostgresStore) GetUserDetailByID(ctx context.Context, userID string) (*models.UserDetail, error) {
	var user models.UserDetail
	err := s.dbpool.QueryRow(ctx,
		`SELECT u.id, u.email, u.role, u.created_at, u.updated_at, 
				up.first_name, up.last_name, up.phone_number, up.bio, up.years_of_experience, up.average_rating
		 FROM users u
		 LEFT JOIN user_details up ON u.id = up.user_id
		 WHERE u.id = $1`,
		userID).Scan(
		&user.ID, &user.Email, &user.Role, &user.CreatedAt, &user.UpdatedAt,
		&user.FirstName, &user.LastName, &user.PhoneNumber, &user.Bio, &user.YearsOfExperience, &user.AverageRating)

	if err != nil {
		return nil, fmt.Errorf("failed to get user by ID: %w", err)
	}
	return &user, nil
}

func (s *PostgresStore) UpdateUserDetail(ctx context.Context, userID string, payload models.UpdateUserPayload) error {
	tx, err := s.dbpool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Handle role update in the 'users' table
	if payload.IsAdmin != nil {
		newRole := "user" // Default non-admin role
		if *payload.IsAdmin {
			newRole = "admin"
		}
		_, err := tx.Exec(ctx, "UPDATE users SET role = $1 WHERE id = $2", newRole, userID)
		if err != nil {
			return fmt.Errorf("failed to update user role: %w", err)
		}
	}

	// Handle profile updates in the 'user_details' table
	query := "UPDATE user_details SET updated_at = NOW()"
	args := []interface{}{}
	argCounter := 1

	if payload.FirstName != nil {
		query += fmt.Sprintf(", first_name = $%d", argCounter)
		args = append(args, *payload.FirstName)
		argCounter++
	}
	if payload.LastName != nil {
		query += fmt.Sprintf(", last_name = $%d", argCounter)
		args = append(args, *payload.LastName)
		argCounter++
	}
	if payload.PhoneNumber != nil {
		query += fmt.Sprintf(", phone_number = $%d", argCounter)
		args = append(args, *payload.PhoneNumber)
		argCounter++
	}
	if payload.Bio != nil {
		query += fmt.Sprintf(", bio = $%d", argCounter)
		args = append(args, *payload.Bio)
		argCounter++
	}
	if payload.YearsOfExperience != nil {
		query += fmt.Sprintf(", years_of_experience = $%d", argCounter)
		args = append(args, *payload.YearsOfExperience)
		argCounter++
	}

	// Only run the update if there are fields to update
	if argCounter > 1 {
		query += fmt.Sprintf(" WHERE user_id = $%d", argCounter)
		args = append(args, userID)

		_, err := tx.Exec(ctx, query, args...)
		if err != nil {
			return fmt.Errorf("failed to update user_details: %w", err)
		}
	}

	return tx.Commit(ctx)
}
func (s *PostgresStore) DeleteUser(ctx context.Context, userID string) error {
	_, err := s.dbpool.Exec(ctx, "DELETE FROM users WHERE id = $1", userID)
	return err
}

func (s *PostgresStore) GetUserEmailByID(ctx context.Context, userID string) (string, error) {
	var email string
	err := s.dbpool.QueryRow(ctx, "SELECT email FROM users WHERE id = $1", userID).Scan(&email)
	return email, err
}

func (s *PostgresStore) GetAllOffersForAdmin(ctx context.Context) ([]models.AdminOfferResponse, error) {
	rows, err := s.dbpool.Query(ctx,
		`SELECT o.id, o.title, o.description, o.offer_type, o.is_active, o.created_at, o.updated_at,
		        u.id as author_id, u.email as author_email,
		        up.first_name as author_first_name
		 FROM offers o
		 JOIN users u ON o.author_id = u.id
		 LEFT JOIN user_details up ON u.id = up.user_id
		 ORDER BY o.created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch all offers for admin: %w", err)
	}
	defer rows.Close()

	offers := make([]models.AdminOfferResponse, 0)
	for rows.Next() {
		var offer models.AdminOfferResponse
		if err := rows.Scan(
			&offer.ID, &offer.Title, &offer.Description, &offer.OfferType, &offer.IsActive,
			&offer.CreatedAt, &offer.UpdatedAt, &offer.AuthorID, &offer.AuthorEmail, &offer.AuthorFirstName);
			err != nil {
			return nil, fmt.Errorf("failed to scan admin offer: %w", err)
		}
		offers = append(offers, offer)
	}

	return offers, nil
}

func (s *PostgresStore) UpdateOfferStatus(ctx context.Context, offerID string, payload models.UpdateOfferPayload) error {
	if payload.IsActive == nil {
		return fmt.Errorf("is_active must be provided")
	}
	_, err := s.dbpool.Exec(ctx, "UPDATE offers SET is_active = $1, updated_at = NOW() WHERE id = $2", *payload.IsActive, offerID)
	return err
}

func (s *PostgresStore) DeleteOffer(ctx context.Context, offerID string) error {
	_, err := s.dbpool.Exec(ctx, "DELETE FROM offers WHERE id = $1", offerID)
	return err
}

func (s *PostgresStore) GetAllCategories(ctx context.Context) ([]models.ServiceCategory, error) {
	rows, err := s.dbpool.Query(ctx, "SELECT id, name, description FROM service_categories ORDER BY name")
	if err != nil {
		return nil, fmt.Errorf("failed to fetch categories: %w", err)
	}
	defer rows.Close()

	categories := make([]models.ServiceCategory, 0)
	for rows.Next() {
		var cat models.ServiceCategory
		if err := rows.Scan(&cat.ID, &cat.Name, &cat.Description); err != nil {
			return nil, fmt.Errorf("failed to scan category: %w", err)
		}
		categories = append(categories, cat)
	}
	return categories, nil
}

func (s *PostgresStore) CreateCategory(ctx context.Context, payload models.CategoryPayload) (int, error) {
	var categoryID int
	err := s.dbpool.QueryRow(ctx, "INSERT INTO service_categories (name, description) VALUES ($1, $2) RETURNING id", payload.Name, payload.Description).Scan(&categoryID)
	return categoryID, err
}

func (s *PostgresStore) UpdateCategory(ctx context.Context, categoryID int, payload models.CategoryPayload) error {
	_, err := s.dbpool.Exec(ctx, "UPDATE service_categories SET name = $1, description = $2 WHERE id = $3", payload.Name, payload.Description, categoryID)
	return err
}

func (s *PostgresStore) DeleteCategory(ctx context.Context, categoryID int) error {
	_, err := s.dbpool.Exec(ctx, "DELETE FROM service_categories WHERE id = $1", categoryID)
	return err
}

func (s *PostgresStore) GetAdminStats(ctx context.Context) (*models.AdminStats, error) {
	var stats models.AdminStats
	err := s.dbpool.QueryRow(ctx, `
		SELECT
			(SELECT COUNT(*) FROM users),
			(SELECT COUNT(*) FROM offers),
			(SELECT COUNT(*) FROM jobs),
			(SELECT COUNT(*) FROM offers WHERE offer_type = 'request_for_service'),
			(SELECT COUNT(*) FROM offers WHERE offer_type = 'service_offer')
	`).Scan(
		&stats.TotalUsers,
		&stats.TotalOffers,
		&stats.TotalJobs,
		&stats.TotalServiceRequests,
		&stats.TotalServiceOffers,
	)
		if err != nil {
			return nil, fmt.Errorf("failed to get admin stats: %w", err)
		}
		return &stats, nil
	}
	
func (s *PostgresStore) CreateOfferResponse(ctx context.Context, response *models.OfferApplication) (string, error) {
	// First, check if a response from this applicant for this offer already exists.
	var exists bool
	err := s.dbpool.QueryRow(ctx,
		"SELECT EXISTS(SELECT 1 FROM offer_responses WHERE offer_id = $1 AND applicant_id = $2)",
		response.OfferID, response.ApplicantID).Scan(&exists)

	if err != nil {
		return "", fmt.Errorf("failed to check for existing response: %w", err)
	}
	if exists {
		return "", fmt.Errorf("response already exists") // Return a specific error
	}

	// If no response exists, create a new one.
	var id string
	query := `INSERT INTO offer_responses (offer_id, applicant_id, message)
			  VALUES ($1, $2, $3) RETURNING id`
	err = s.dbpool.QueryRow(ctx, query, response.OfferID, response.ApplicantID, response.Message).Scan(&id)
	if err != nil {
		return "", fmt.Errorf("failed to create offer response: %w", err)
	}
	return id, nil
}

func (s *PostgresStore) GetOfferApplications(ctx context.Context, offerID string) ([]models.OfferApplication, error) {
	query := `
		SELECT
			r.id, r.offer_id, r.applicant_id, r.message, r.status, r.created_at,
			ud.first_name, ud.average_rating
		FROM offer_responses r
		JOIN user_details ud ON r.applicant_id = ud.user_id
		WHERE r.offer_id = $1
		ORDER BY r.created_at DESC
	`
	rows, err := s.dbpool.Query(ctx, query, offerID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch offer applications: %w", err)
	}
	defer rows.Close()

	applications := make([]models.OfferApplication, 0)
	for rows.Next() {
		var app models.OfferApplication
		if err := rows.Scan(
			&app.ID, &app.OfferID, &app.ApplicantID, &app.Message, &app.Status, &app.CreatedAt,
			&app.ApplicantFirstName, &app.ApplicantRating,
		); err != nil {
			return nil, fmt.Errorf("failed to scan offer application: %w", err)
		}
		applications = append(applications, app)
	}

	return applications, nil
}

func (s *PostgresStore) GetOfferAuthor(ctx context.Context, offerID string) (string, error) {
	var authorID string
	err := s.dbpool.QueryRow(ctx, "SELECT author_id FROM offers WHERE id = $1", offerID).Scan(&authorID)
	if err != nil {
		return "", fmt.Errorf("failed to get offer author: %w", err)
	}
	return authorID, nil
}

// --- Chat Implementations ---

func (s *PostgresStore) InitiateChat(ctx context.Context, offerID, initiatorID, recipientID string) (string, error) {
	tx, err := s.dbpool.Begin(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Check if a conversation already exists for this offer with these two participants
	var conversationID string
	err = tx.QueryRow(ctx, `
		SELECT cp1.conversation_id
		FROM conversation_participants cp1
		JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
		JOIN conversations c ON cp1.conversation_id = c.id
		WHERE c.offer_id = $1
		  AND cp1.user_id = $2
		  AND cp2.user_id = $3
	`, offerID, initiatorID, recipientID).Scan(&conversationID)

	// If a conversation is found, return its ID
	if err == nil {
		return conversationID, nil
	}
	// If no rows are found, that's expected, so we continue. Any other error is a problem.
	if err != nil && err.Error() != "no rows in result set" {
		return "", fmt.Errorf("failed to check for existing conversation: %w", err)
	}

	// No existing conversation found, so create a new one
	err = tx.QueryRow(ctx,
		"INSERT INTO conversations (offer_id) VALUES ($1) RETURNING id",
		offerID).Scan(&conversationID)
	if err != nil {
		return "", fmt.Errorf("failed to create conversation: %w", err)
	}

	// Add both users as participants
	_, err = tx.Exec(ctx,
		"INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3)",
		conversationID, initiatorID, recipientID)
	if err != nil {
		return "", fmt.Errorf("failed to add participants to conversation: %w", err)
	}

	return conversationID, tx.Commit(ctx)
}

func (s *PostgresStore) GetChatDetails(ctx context.Context, conversationID, userID string) (*models.ChatDetailsResponse, error) {
	// First, verify the user is part of the conversation
	var isParticipant bool
	err := s.dbpool.QueryRow(ctx,
		"SELECT EXISTS(SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2)",
		conversationID, userID).Scan(&isParticipant)
	if err != nil {
		return nil, fmt.Errorf("failed to verify participant: %w", err)
	}
	if !isParticipant {
		return nil, fmt.Errorf("user is not a participant in this conversation")
	}

	// Get conversation and offer details
	var details models.ChatDetailsResponse
	err = s.dbpool.QueryRow(ctx, `
		SELECT c.id, c.offer_id, o.title
		FROM conversations c
		JOIN offers o ON c.offer_id = o.id
		WHERE c.id = $1
	`, conversationID).Scan(&details.ConversationID, &details.OfferID, &details.OfferTitle)
	if err != nil {
		return nil, fmt.Errorf("failed to get conversation details: %w", err)
	}

	// Get participant details
	rows, err := s.dbpool.Query(ctx, `
		SELECT u.id, u.email, u.role, u.created_at, u.updated_at, 
			   ud.first_name, ud.last_name, ud.phone_number, ud.bio, ud.years_of_experience, ud.average_rating
		FROM users u
		JOIN user_details ud ON u.id = ud.user_id
		JOIN conversation_participants cp ON u.id = cp.user_id
		WHERE cp.conversation_id = $1
	`, conversationID)
	if err != nil {
		return nil, fmt.Errorf("failed to get participant details: %w", err)
	}
	defer rows.Close()

	participants := make([]models.UserDetail, 0)
	for rows.Next() {
		var p models.UserDetail
		if err := rows.Scan(&p.ID, &p.Email, &p.Role, &p.CreatedAt, &p.UpdatedAt, &p.FirstName, &p.LastName, &p.PhoneNumber, &p.Bio, &p.YearsOfExperience, &p.AverageRating); err != nil {
			return nil, fmt.Errorf("failed to scan participant detail: %w", err)
		}
		participants = append(participants, p)
	}
	details.Participants = participants

	return &details, nil
}

func (s *PostgresStore) PostMessage(ctx context.Context, conversationID, senderID, content string) (*models.MessageResponse, error) {
	var msg models.MessageResponse
	err := s.dbpool.QueryRow(ctx, `
		WITH inserted_message AS (
			INSERT INTO messages (conversation_id, sender_id, content)
			VALUES ($1, $2, $3)
			RETURNING id, conversation_id, sender_id, content, created_at, is_read
		)
		SELECT m.id, m.conversation_id, m.sender_id, ud.first_name, m.content, m.created_at, m.is_read
		FROM inserted_message m
		JOIN user_details ud ON m.sender_id = ud.user_id
	`, conversationID, senderID, content).Scan(
		&msg.ID, &msg.ConversationID, &msg.SenderID, &msg.SenderFirstName, &msg.Content, &msg.CreatedAt, &msg.IsRead,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to post message: %w", err)
	}
	return &msg, nil
}

func (s *PostgresStore) GetMessages(ctx context.Context, conversationID, userID string) ([]models.MessageResponse, error) {
	// Verify the user is part of the conversation
	var isParticipant bool
	err := s.dbpool.QueryRow(ctx,
		"SELECT EXISTS(SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2)",
		conversationID, userID).Scan(&isParticipant)
	if err != nil {
		return nil, fmt.Errorf("failed to verify participant: %w", err)
	}
	if !isParticipant {
		return nil, fmt.Errorf("user is not a participant in this conversation")
	}

	rows, err := s.dbpool.Query(ctx, `
		SELECT m.id, m.conversation_id, m.sender_id, ud.first_name, m.content, m.created_at, m.is_read
		FROM messages m
		JOIN user_details ud ON m.sender_id = ud.user_id
		WHERE m.conversation_id = $1
		ORDER BY m.created_at ASC
	`, conversationID)
	if err != nil {
		return nil, fmt.Errorf("failed to get messages: %w", err)
	}
	defer rows.Close()

	messages := make([]models.MessageResponse, 0)
	for rows.Next() {
		var msg models.MessageResponse
		if err := rows.Scan(&msg.ID, &msg.ConversationID, &msg.SenderID, &msg.SenderFirstName, &msg.Content, &msg.CreatedAt, &msg.IsRead); err != nil {
			return nil, fmt.Errorf("failed to scan message: %w", err)
		}
		messages = append(messages, msg)
	}

	return messages, nil
}

func (s *PostgresStore) GetConversations(ctx context.Context, userID string) ([]models.ConversationPreview, error) {
	query := `
		WITH LastMessage AS (
			SELECT
				conversation_id,
				content,
				created_at,
				ROW_NUMBER() OVER(PARTITION BY conversation_id ORDER BY created_at DESC) as rn
			FROM messages
		)
		SELECT
			c.id as conversation_id,
			other_p.user_id as other_participant_id,
			other_ud.first_name as other_participant_name,
			COALESCE(lm.content, '') as last_message_content,
			COALESCE(lm.created_at, c.created_at) as last_message_at,
			o.title as offer_title
		FROM
			conversations c
		JOIN
			conversation_participants current_p ON c.id = current_p.conversation_id
		JOIN
			conversation_participants other_p ON c.id = other_p.conversation_id AND current_p.user_id != other_p.user_id
		JOIN
			user_details other_ud ON other_p.user_id = other_ud.user_id
		JOIN
			offers o ON c.offer_id = o.id
		LEFT JOIN
			LastMessage lm ON c.id = lm.conversation_id AND lm.rn = 1
		WHERE
			current_p.user_id = $1
		ORDER BY
			last_message_at DESC
	`

	rows, err := s.dbpool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get conversations: %w", err)
	}
	defer rows.Close()

	conversations := make([]models.ConversationPreview, 0)
	for rows.Next() {
		var convo models.ConversationPreview
		if err := rows.Scan(
			&convo.ConversationID,
			&convo.OtherParticipantID,
			&convo.OtherParticipantName,
			&convo.LastMessageContent,
			&convo.LastMessageAt,
			&convo.OfferTitle,
		); err != nil {
			return nil, fmt.Errorf("failed to scan conversation preview: %w", err)
		}
		conversations = append(conversations, convo)
	}

	return conversations, nil
}

	