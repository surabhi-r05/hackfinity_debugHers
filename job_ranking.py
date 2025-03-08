from flask import Flask, request, jsonify
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
from fuzzywuzzy import process
import json
from flask_cors import CORS
import re  # Add this at the top of the file


app = Flask(__name__)
CORS(app)  # Enable CORS for all routes


# Load BERT model
bert_model = SentenceTransformer('all-MiniLM-L6-v2')

# Load job data
def load_jobs_data():
    with open('final_jobs_corrected.json', 'r', encoding='utf-8') as file:
        jobs_data = json.load(file)
    return pd.DataFrame(jobs_data)

jobs_df = load_jobs_data()

def compute_bert_similarity(text1, text2):
    embedding1 = bert_model.encode(text1, convert_to_tensor=True)
    embedding2 = bert_model.encode(text2, convert_to_tensor=True)
    return np.dot(embedding1, embedding2) / (np.linalg.norm(embedding1) * np.linalg.norm(embedding2))

def get_best_matching_role(user_role, job_roles):
    fuzzy_matches = process.extract(user_role, job_roles, limit=3)
    best_role = max(fuzzy_matches, key=lambda match: compute_bert_similarity(user_role, match[0]))[0]
    return best_role

def parse_experience(exp_string):
    """Extracts numeric experience value from text."""
    numbers = [int(s) for s in exp_string.split() if s.isdigit()]
    return numbers[0] if numbers else 0


def extract_min_experience(exp_string):
    """Extracts the minimum experience from strings like '4 to 9 years'."""
    numbers = re.findall(r'\d+', exp_string)  # Extract numbers
    return int(numbers[0]) if numbers else 0  # Use first number or 0

def rank_jobs(user_input):
    user_role = user_input.get('jobRole', '')
    user_skills = user_input.get('skills', '')
    user_experience = int(user_input.get('experience', 0))  
    user_location = user_input.get('workPreference', '')  
    user_daycare = user_input.get('childcare', '')

    job_roles_list = jobs_df['job_role'].dropna().unique()  # ✅ Remove None values
    best_matching_role = get_best_matching_role(user_role, job_roles_list)

    scores = []
    for _, job in jobs_df.iterrows():
        job_role = job.get('job_role', '')  # ✅ Handle missing job roles
        job_skills = job.get('skills', '')  # ✅ Handle missing skills
        job_experience = extract_min_experience(job.get('experience', '0'))  # ✅ Handle missing experience
        job_location = job.get('location', '')  # ✅ Handle missing location
        job_daycare = job.get('daycare', 'No')  # ✅ Default to "No" if missing

        # Skip if job_role is empty (invalid job entry)
        if not job_role:
            continue  

        # BERT-based Job Role Matching
        role_similarity = compute_bert_similarity(best_matching_role, job_role)

        # TF-IDF for Skills Matching
        vectorizer = TfidfVectorizer()
        skill_vectors = vectorizer.fit_transform([user_skills, job_skills])
        skill_similarity = cosine_similarity(skill_vectors[0], skill_vectors[1])[0][0]

        # Experience Match (scaled score)
        experience_score = max(0, 1 - abs(user_experience - job_experience) / max(1, job_experience))

        # Location & Daycare Matching
        location_score = 1 if user_location.lower() == job_location.lower() else 0.5
        daycare_score = 1 if user_daycare == job_daycare else 0.5

        # Weighted Score Calculation
        total_score = (role_similarity * 0.50 +
                       skill_similarity * 0.20 +
                       experience_score * 0.10 +
                       daycare_score * 0.10 +
                       location_score * 0.10)

        scores.append((job.to_dict(), total_score))

    ranked_jobs = sorted(scores, key=lambda x: x[1], reverse=True)[:5]
    return [job[0] for job in ranked_jobs]




@app.route('/get_recommendations', methods=['POST'])
def get_recommendations():
    try:
        user_input = request.json  # Get JSON data from frontend
        print("Received user input:", user_input)  # Debugging line
        recommended_jobs = rank_jobs(user_input)
        return jsonify(recommended_jobs)
    except Exception as e:
        print("🔥 ERROR:", str(e))  # Print the error in Flask console
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
