import csv

# Input and output file paths
input_file = "c:\\backup\\Workout Log\\pythonSCrap\\exercises.csv"
output_file = "c:\\backup\\Workout Log\\pythonSCrap\\processed_exercises.csv"

def infer_missing_values(row):
    """
    Infer or generate missing values for a single row based on existing data.
    """
    muscle_group = row[0]
    exercise = row[1]
    
    # Example logic to infer values
    difficulty_level = "Medium" if "Pull" in exercise or "Row" in exercise else "Easy"
    equipment_required = "Dumbbell" if "Dumbbell" in exercise else "None"
    target_intensity = "70%" if difficulty_level == "Medium" else "N/A"
    primary_muscle_group = muscle_group
    secondary_muscle_group = "Biceps" if "Pull" in exercise else "Triceps"
    exercise_duration = "3" if difficulty_level == "Medium" else "2"
    recovery_time = "60" if difficulty_level == "Medium" else "30"
    exercise_type = "Strength" if "Row" in exercise or "Squat" in exercise else "Cardio"
    calories_burned = "8" if exercise_type == "Strength" else "5"
    exercise_progression = "Increase weight" if exercise_type == "Strength" else "Increase reps"
    injury_risk_level = "Low" if difficulty_level == "Easy" else "Medium"
    
    return [
        difficulty_level,
        equipment_required,
        target_intensity,
        primary_muscle_group,
        secondary_muscle_group,
        exercise_duration,
        recovery_time,
        exercise_type,
        calories_burned,
        exercise_progression,
        injury_risk_level
    ]

def complete_with_logic(chunk):
    """
    Complete missing values for each row in the chunk using local logic.
    """
    completed_chunk = []
    for row in chunk:
        if len(row) < 13:  # Check if the row has missing values
            row += infer_missing_values(row)
        completed_chunk.append(row)
    return completed_chunk

def main():
    with open(input_file, mode="r", newline="", encoding="utf-8") as infile, \
         open(output_file, mode="w", newline="", encoding="utf-8") as outfile:
        
        reader = csv.reader(infile)
        writer = csv.writer(outfile)
        
        # Write header to the output file
        header = next(reader)
        header += [
            "Difficulty_Level", "Equipment_Required", "Target_Intensity",
            "Primary_Muscle_Group", "Secondary_Muscle_Group", "Exercise_Duration",
            "Recovery_Time", "Exercise_Type", "Calories_Burned",
            "Exercise_Progression", "Injury_Risk_Level"
        ]
        writer.writerow(header)
        
        # Process the file in chunks of 10 lines
        chunk = []
        for row in reader:
            chunk.append(row)
            if len(chunk) == 10:
                completed_chunk = complete_with_logic(chunk)  # Complete using local logic
                writer.writerows(completed_chunk)
                chunk = []
        
        # Process any remaining rows
        if chunk:
            completed_chunk = complete_with_logic(chunk)  # Complete using local logic
            writer.writerows(completed_chunk)

if __name__ == "__main__":
    main()
