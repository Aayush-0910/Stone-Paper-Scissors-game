import random
import os

# ASCII art for the choices
ROCK = """
    _______
---'   ____)____
      (____)
      (____)
      (____)
---.__(___)
"""

PAPER = """
    _______
---'   ____)____
          ______)
          _______)
         _______)
---.__________)
"""

SCISSORS = """
    _______
---'   ____)____
          ______)
       __________)
      (____)
---.__(___)
"""

CHOICES_ART = {"stone": ROCK, "paper": PAPER, "scissors": SCISSORS}
OPTIONS = ["stone", "paper", "scissors"]

def clear_screen():
    """Clears the terminal screen."""
    os.system('cls' if os.name == 'nt' else 'clear')

def get_user_choice():
    """Gets and validates the user's choice."""
    while True:
        user_choice = input("Enter your choice (stone/paper/scissors): ").lower()
        if user_choice in OPTIONS:
            return user_choice
        print("Invalid choice! Please try again.")

def get_computer_choice():
    """Gets a random choice for the computer."""
    return random.choice(OPTIONS)

def determine_winner(user_choice, computer_choice):
    """Determines the winner of the round."""
    if user_choice == computer_choice:
        return "draw"
    elif (user_choice == "stone" and computer_choice == "scissors") or \
         (user_choice == "paper" and computer_choice == "stone") or \
         (user_choice == "scissors" and computer_choice == "paper"):
        return "user"
    else:
        return "computer"

def display_choices(user_choice, computer_choice):
    """Displays the choices with ASCII art."""
    print("\nYour choice:")
    print(CHOICES_ART[user_choice])
    print("Computer's choice:")
    print(CHOICES_ART[computer_choice])

def play_game():
    """Main function to run the game."""
    user_score = 0
    computer_score = 0

    while True:
        clear_screen()
        print("===================================")
        print("  Welcome to Stone, Paper, Scissors!")
        print("===================================")
        print(f"Score: You {user_score} - {computer_score} Computer")
        print("-----------------------------------")

        user_choice = get_user_choice()
        computer_choice = get_computer_choice()

        display_choices(user_choice, computer_choice)

        winner = determine_winner(user_choice, computer_choice)

        if winner == "user":
            print("\n🎉 You win this round! 🎉")
            user_score += 1
        elif winner == "computer":
            print("\n😢 Computer wins this round! 😢")
            computer_score += 1
        else:
            print("\nIt's a draw!")

        print("-----------------------------------")
        
        while True:
            play_again = input("Play another round? (yes/no): ").lower()
            if play_again in ["yes", "no"]:
                break
            print("Invalid input. Please enter 'yes' or 'no'.")

        if play_again != "yes":
            break
    
    clear_screen()
    print("===================================")
    print("           Game Over!")
    print("===================================")
    print(f"Final Score: You {user_score} - {computer_score} Computer")
    if user_score > computer_score:
        print("Congratulations! You won the game! 🏆")
    elif computer_score > user_score:
        print("Better luck next time! The computer won. 💻")
    else:
        print("The game ended in a draw!")
    print("===================================")


if __name__ == "__main__":
    play_game()
