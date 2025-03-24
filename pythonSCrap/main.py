import requests
from bs4 import BeautifulSoup
import time
import csv
from urllib.parse import urljoin

def scrape_exercises_from_page(url):
    """
    Scrape exercises from a single page URL, including exercise link and image link.
    Returns a list of dictionaries with exercise details.
    
    Args:
        url (str): The URL of the page to scrape.
    
    Returns:
        list: A list of dictionaries with 'exercise', 'primary_muscles', 'exercise_link', and 'image_link'.
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"Failed to fetch {url}: {e}")
        return []
    
    soup = BeautifulSoup(response.text, 'html.parser')
    exercise_section = soup.find('section', class_='exercise_list')
    
    if not exercise_section:
        print(f"Exercise list section not found at {url}.")
        return []
    
    articles = exercise_section.find_all('article', class_='entry')
    exercises = []
    
    for article in articles:
        # Extract exercise name and link
        title_tag = article.find('h2', class_='title')
        exercise_name = title_tag.a.text.strip() if title_tag and title_tag.a else "Unknown"
        exercise_link = title_tag.a['href'] if title_tag and title_tag.a else "Not available"
        
        # Extract primary muscles
        primary_muscles_div = article.find('div', class_='exercise_meta primary_muscles')
        if primary_muscles_div:
            muscles_text = primary_muscles_div.text.replace('Primary Muscles:', '').strip()
            primary_muscles = [muscle.strip() for muscle in muscles_text.split(',')]
        else:
            primary_muscles = ["Not specified"]
        
        # Extract image link
        thumbnail_div = article.find('div', class_='thumbnails')
        image_link = thumbnail_div.find('img')['src'] if thumbnail_div and thumbnail_div.find('img') else "Not available"
        
        # Add exercise data, duplicating for each primary muscle
        for muscle in primary_muscles:
            exercises.append({
                'exercise': exercise_name,
                'primary_muscle': muscle,
                'exercise_link': exercise_link,
                'image_link': image_link
            })
    
    return exercises

def scrape_all_pages(base_url):
    """
    Scrape exercises from all paginated pages starting from the base URL.
    Returns a complete list of exercises.
    
    Args:
        base_url (str): The starting URL (e.g., 'https://fitnessprogramer.com/exercises/').
    
    Returns:
        list: A list of all exercises across pages.
    """
    all_exercises = []
    page_num = 1
    
    while True:
        if page_num == 1:
            current_url = base_url
        else:
            current_url = urljoin(base_url, f"page/{page_num}/")
        
        print(f"Scraping page {page_num}: {current_url}")
        exercises = scrape_exercises_from_page(current_url)
        
        if not exercises:
            print(f"No more exercises found at page {page_num}. Stopping.")
            break
        
        all_exercises.extend(exercises)
        print(f"Scraped {len(exercises)} exercises from page {page_num}.")
        
        page_num += 1
        time.sleep(1)  # Be polite to the server
    
    return all_exercises

def save_to_csv(exercises, filename='exercises.csv'):
    """
    Save the list of exercises to a CSV file with exercise link and image link.
    
    Args:
        exercises (list): List of dictionaries containing exercise data.
        filename (str): Name of the CSV file to save to.
    """
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['exercise', 'primary_muscle', 'exercise_link', 'image_link']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        writer.writeheader()
        for exercise in exercises:
            writer.writerow({
                'exercise': exercise['exercise'],
                'primary_muscle': exercise['primary_muscle'],
                'exercise_link': exercise['exercise_link'],
                'image_link': exercise['image_link']
            })

def main():
    # Base URL for the exercise list
    base_url = "https://fitnessprogramer.com/exercises/"
    
    # Scrape all pages
    exercises = scrape_all_pages(base_url)
    
    # Print the total results
    print(f"\nTotal scraped {len(exercises)} entries from all pages.")
    for exercise in exercises:
        print(f"Exercise: {exercise['exercise']}, Primary Muscle: {exercise['primary_muscle']}, "
              f"Link: {exercise['exercise_link']}, Image: {exercise['image_link']}")
    
    # Save to CSV
    if exercises:
        save_to_csv(exercises)
        print(f"Saved {len(exercises)} entries to 'exercises.csv'.")
    else:
        print("\nNo exercises scraped. Check the troubleshooting steps:")
        print("1. Verify the base URL: Ensure it’s correct (e.g., https://fitnessprogramer.com/exercises/).")
        print("2. Check for JavaScript: If content is dynamic, this script won’t work without Selenium.")
        print("3. Adjust HTML selector: The list might not be in <section class='exercise_list'>.")

if __name__ == "__main__":
    main()