import csv
import pandas as pd

# File paths
exercise_list_file = r"c:\\backup\\Workout Log\\pythonSCrap\\exercise list - Exercises.csv"
consolidated_file = r"c:\\backup\\Workout Log\\pythonSCrap\\consolidated_exercises.csv"
output_file = r"c:\\backup\\Workout Log\\pythonSCrap\\exercise list - Exercises_filled.csv"

# Read consolidated exercises into a dictionary
consolidated_data = {}
with open(consolidated_file, mode='r', encoding='utf-8') as consolidated:
    reader = csv.DictReader(consolidated)
    for row in reader:
        key = (row['Muscle_Group'], row['Exercise'])
        consolidated_data[key] = row

# Read exercise list and fill missing details
with open(exercise_list_file, mode='r', encoding='utf-8') as exercise_list, \
     open(output_file, mode='w', encoding='utf-8', newline='') as output:
    reader = csv.DictReader(exercise_list)
    fieldnames = reader.fieldnames + [
        'Difficulty_Level', 'Equipment_Required', 'Target_Intensity', 
        'Primary_Muscle_Group', 'Secondary_Muscle_Group', 'Exercise_Duration', 
        'Recovery_Time', 'Exercise_Type', 'Calories_Burned', 
        'Exercise_Progression', 'Injury_Risk_Level'
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()

    for row in reader:
        key = (row['Muscle_Group'], row['Exercise'])
        if key in consolidated_data:
            for field in [
                'Difficulty_Level', 'Equipment_Required', 'Target_Intensity', 
                'Primary_Muscle_Group', 'Secondary_Muscle_Group', 'Exercise_Duration', 
                'Recovery_Time', 'Exercise_Type', 'Calories_Burned', 
                'Exercise_Progression', 'Injury_Risk_Level'
            ]:
                row[field] = consolidated_data[key].get(field, '')
        writer.writerow(row)

# Load the CSV file
data = pd.read_csv("exercise list - Exercises_filled.csv")

# Normalize Difficulty_Level column
data['Difficulty_Level'] = data['Difficulty_Level'].replace({
    'Beginner': 'Easy',
    'Intermediate': 'Medium',
    'Advanced': 'Hard'
})

# Normalize Injury_Risk_Level column
data['Injury_Risk_Level'] = data['Injury_Risk_Level'].replace({
    'Low': 'Low',
    'Moderate': 'Medium',
    'High': 'High'
})

# Save the partially normalized data back to the CSV file
data.to_csv("exercise list - Exercises_filled.csv", index=False)
