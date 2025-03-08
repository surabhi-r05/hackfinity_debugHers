// script.js - Handles job listing, search, and recommendations

let userPreferences = {};

// Load user preferences from local storage
function loadUserPreferences() {
    const storedData = localStorage.getItem("jobFormData");
    if (storedData) {
        userPreferences = JSON.parse(storedData);
        console.log("Loaded User Preferences:", userPreferences);
    }
}

// Fetch and display jobs
async function loadJobs() {
    try {
        const response = await fetch("final_jobs_corrected.json");
        const jobs = await response.json();
        displayJobs(jobs); // Show all jobs
    } catch (error) {
        console.error("Error loading jobs:", error);
    }
}

async function loadRecommendedJobs() {
    let storedData = localStorage.getItem("jobFormData");
    if (!storedData) {
        console.error("No saved preferences found.");
        document.getElementById("recommended-list").innerHTML = "<p>No saved preferences.</p>";
        return;
    }

    let userPreferences = JSON.parse(storedData);  // Load saved form data

    try {
        document.getElementById("recommended-list").innerHTML = "<p>Loading recommendations...</p>";

        const response = await fetch("http://127.0.0.1:5000/get_recommendations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userPreferences)  // Send full form data
        });

        if (!response.ok) throw new Error("Network response was not ok");

        const recommendedJobs = await response.json();
        displayRecommendedJobs(recommendedJobs);
    } catch (error) {
        console.error("Error fetching recommended jobs:", error);
        document.getElementById("recommended-list").innerHTML = "<p>Failed to load recommendations.</p>";
    }
}

// Display recommended jobs on the webpage
function displayRecommendedJobs(jobs) {
    const recommendedContainer = document.getElementById("recommended-list");
    recommendedContainer.innerHTML = "";

    if (jobs.length === 0) {
        recommendedContainer.innerHTML = "<p>No recommended jobs found.</p>";
        return;
    }

    jobs.forEach(job => {
        recommendedContainer.appendChild(createJobCard(job, true));
    });
}

// Display all jobs
function displayJobs(jobs) {
    const jobList = document.getElementById("job-list");
    jobList.innerHTML = "";

    jobs.forEach(job => {
        jobList.appendChild(createJobCard(job, false));
    });
}

function createJobCard(job, isRecommended) {
    const jobElement = document.createElement("div");
    jobElement.classList.add("job-card");

    let skillsText = Array.isArray(job.skills) ? job.skills.join(", ") : job.skills || "Not specified";
    let descriptionText = job.description || "No description available"; // Adding job description

    // Check if the company has a Gold or Silver badge
    const goldCompany = goldBadgeCompanies.find(company => company.name === job.company);
    const silverCompany = silverBadgeCompanies.find(company => company.name === job.company);

    let badgeHtml = "";
    if (goldCompany) {
        badgeHtml = `
            <span class="badge-icon gold-badge" onclick="showProgramInfo('${goldCompany.name}')">
                <img src="gold-badge-icon.png" alt="Gold Badge">
            </span>
        `;
    } else if (silverCompany) {
        badgeHtml = `
            <span class="badge-icon silver-badge" onclick="showProgramInfo('${silverCompany.name}')">
                <img src="silver-badge-icon.png" alt="Silver Badge">
            </span>
        `;
    }

    jobElement.innerHTML = `
        <div class="badge-container">
            ${badgeHtml}
        </div>
        <h2>${job.title}</h2>
        <p><strong>Company:</strong> ${job.company}</p>
        <p><strong>Location:</strong> ${job.location}</p>
        <p><strong>Skills:</strong> ${skillsText}</p>
        <p><strong>Experience:</strong> ${job.experience}</p>
        <p><strong>Daycare:</strong> ${job.daycare ? "Yes" : "No"}</p>
        <p><strong>Description:</strong> ${descriptionText}</p>  <!-- Adding job description -->
        <a href="${job.apply_link}" class="apply-btn" target="_blank">Apply</a>
    `;

    if (isRecommended) {
        jobElement.classList.add("glow-box"); // Highlight recommendations
    }

    return jobElement;
}
// Show returnship or flexible work info when badge is clicked
function showProgramInfo(companyName) {
    let companyInfo = goldBadgeCompanies.find(company => company.name === companyName) || silverBadgeCompanies.find(company => company.name === companyName);
    if (companyInfo) {
        alert(`Program Info: ${companyInfo.programInfo}\nLink: ${companyInfo.programLink}`);
    }
}


// Filter jobs based on search inputs
function filterJobs() {
    const titleFilter = document.getElementById("title").value.toLowerCase();
    const companyFilter = document.getElementById("company").value.toLowerCase();
    const locationFilter = document.getElementById("location").value;
    const daycareFilter = document.getElementById("daycare").value;

    fetch("final_jobs_corrected.json")
        .then(response => response.json())
        .then(jobs => {
            const filteredJobs = jobs.filter(job =>
                (titleFilter === "" || job.title.toLowerCase().includes(titleFilter)) &&
                (companyFilter === "" || job.company.toLowerCase().includes(companyFilter)) &&
                (locationFilter === "" || job.location === locationFilter) &&
                (daycareFilter === "" || job.daycare === daycareFilter)
            );
            displayJobs(filteredJobs);
        })
        .catch(error => console.error("Error filtering jobs:", error));
}
// Show returnship or flexible work info in the modal when badge is clicked
function showProgramInfo(companyName) {
    let companyInfo = goldBadgeCompanies.find(company => company.name === companyName) || silverBadgeCompanies.find(company => company.name === companyName);
    
    if (companyInfo) {
        // Populate modal with company details
        document.getElementById("programTitle").textContent = companyInfo.name;
        document.getElementById("programInfo").textContent = companyInfo.programInfo;
        document.getElementById("programLink").href = companyInfo.programLink;
        
        // Display the modal
        document.getElementById("programModal").style.display = "block";
    }
}

// Close the modal when the user clicks on the close button
document.getElementById("closeModal").addEventListener("click", function() {
    document.getElementById("programModal").style.display = "none";
});

// Close the modal if the user clicks anywhere outside the modal
window.addEventListener("click", function(event) {
    if (event.target === document.getElementById("programModal")) {
        document.getElementById("programModal").style.display = "none";
    }
});

const goldBadgeCompanies = [
    {
        name: "Infosys",
        programLink: "https://www.infosys.com/careers/exclusive-programs/restart-careers-infosys.html",
        programInfo: `A strong Return to Work post Maternity program has ensured a whopping 99% women return to work post maternity.
                        - Eligibility: Minimum 6 months of career break
                        - Training and Mentorship
                        - Re-skilling and Up-skilling opportunities
                        - Full-time/Part-time job opportunities (Work from home options available)`
    },
    {
        name: "Oracle",
        programLink: "https://www.oracle.com/careers/relaunch/",
        programInfo: `Relaunch your career with Oracle Career Relaunch, a program for individuals who’ve taken a career break of at least one year for reasons like family or caregiving. 
               - Full-time position with benefits
               - 12-week onboarding with personalized development plan
               - Strong mentorship from hiring managers and dedicated mentors
               - Cohort community for peer support and future mentorship`
},
    {
        name: "TCS",
        programLink: "https://www.tcs.com/careers/india/rebegin",
        programInfo: `TCS provides a creche facility at its offices. This initiative is open for women professionals across India who are looking to re-begin their careers after a break due to family/health/education/personal reasons. 
                        - Minimum 2 years of relevant experience required
                        - Open to candidates with long breaks due to family/personal circumstances`
    },
    {
        name: "IBM",
        programLink: "https://www.ibm.com/blogs/jobs/return-to-the-workforce-with-the-ibm-tech-re-entry-program/",
        programInfo: `IBM Tech Re-Entry is a full-time, paid returnship program for technical professionals who took a break from the workforce, for one or more years, and are looking to restart their careers.
                        - Refresh skills with prescriptive learning plans
                        - Work on real-world, high-impact projects
                        - Access to the latest tools and technologies`
    },
    {
        name: "Accenture",
        programLink: "https://www.accenture.com/in-en/careers/local/career-reboot-program",
        programInfo: `Accenture partners with third-party organizations such as everywomanNetwork and Catalyst to provide free access to online self-development platforms to women employees. 
                        - Offers learning boards, mentorship, and training programs to support career aspirations`
    },
    {
        name: "Accenture Strategy & Consulting",
        programLink: "https://www.accenture.com/in-en/careers/local/career-reboot-program",
        programInfo: `Accenture partners with third-party organizations such as everywomanNetwork and Catalyst to provide free access to online self-development platforms to women employees. 
                        - Offers learning boards, mentorship, and training programs to support career aspirations`
    },
    {
        name: "Cisco",
        programLink: "https://womenbacktowork.org/job-seeker/current-returnships/cisco/",
        programInfo: `Cisco’s Return-to-Work program welcomes candidates who have taken a career gap and want to re-enter the workforce.
                        - Gap in the resume is welcome, and applications are open to candidates with varied professional experiences`
    },
    {
        name: "Wipro",
        programLink: "https://careers.wipro.com/go/Begin-Again/9369355/",
        programInfo: `Wipro’s Begin Again program helps women relaunch their careers post-break. 
                        - Suitable for women who took breaks due to personal reasons like sabbaticals, motherhood, elderly care, etc.
                        - Full-time/Part-time opportunities available`
    },
    {
        name: "Capgemini",
        programLink: "https://www.capgemini.com/gb-en/careers/career-paths/relaunchcapgemini/",
        programInfo: `Capgemini’s Relaunch Program is aimed at those who have taken a career break of 18 months to 10 years. 
                        - 6-month tailored program to refresh and update skills
                        - Confidence-building activities and mentorship`
    },
    {
        name: "Cognizant",
        programLink: "https://careers.cognizant.com/india-en/pathways-and-programs/returnship/",
        programInfo: `Cognizant’s Returnship Program is a 3-month paid experience for technology professionals who have taken a career break of at least 18 months.
                        - Includes upskilling, shadowing real-time projects, and coaching
                        - Mentorship throughout the program`
    }
];

const silverBadgeCompanies = [
    {
        name: "Thomson Reuters",
        programLink: "https://www.thomsonreuters.com/en/careers/careers-blog/tips-for-a-new-parent-returning-to-work",
        programInfo: `Thomson Reuters provides a supportive environment for new parents returning to work, offering various tips for a smooth transition.
                        - Includes tips and advice on balancing work and new parenthood
                        - Access to creche facilities to support working parents`
    },
    {
        name: "Capco",
        programLink: "#",
        programInfo: `Capco offers flexible work options for new parents re-entering the workforce, including flexible working hours and work-from-home options.
                        - Supports a healthy work-life balance for professionals returning after a break`
    },
    {
        name: "EY",
        programLink: "#",
        programInfo: `EY offers a returnship program in the US, helping professionals re-enter the workforce after a break.
                        - Designed for those who want to return to work with flexible schedules and support`
    },
    {
        name: "Genpact",
        programLink: "#",
        programInfo: `Genpact provides flexible work options and support for professionals returning after a break.
                        - Encourages diversity and flexibility in the workforce`
    }
];


// Initialize
document.addEventListener("DOMContentLoaded", () => {
    loadUserPreferences();
    loadJobs();
    loadRecommendedJobs();
});
