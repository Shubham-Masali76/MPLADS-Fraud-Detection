import os
import random
import hashlib
from datetime import datetime

import numpy as np
import pandas as pd


# ============================================================
# MPLADS SYNTHETIC DATA GENERATOR
# ============================================================
#
# This version generates:
#   - 1 LAKH PROJECTS
#   - 100 MPs
#   - 50,000 Vendors
#   - Project amounts from ₹5 lakh to ₹1 crore
#
# IMPORTANT:
# This generates SYNTHETIC data for ML/testing.
# ============================================================


# ============================================================
# CONFIGURATION
# ============================================================

# 1 LAKH PROJECTS
NUM_PROJECTS = 100_000

# Generate this many rows at a time.
CHUNK_SIZE = 100_000

NUM_MPS = 100
NUM_VENDORS = 50_000

OUTPUT_DIR = "data"

# Percentage of projects containing synthetic suspicious patterns.
FRAUD_RATE = 0.10

# Reproducible data
SEED = 42

random.seed(SEED)
np.random.seed(SEED)


# ============================================================
# MONEY UNITS
# ============================================================

LAKH = 100_000
CRORE = 10_000_000

# Project amount range
PROJECT_AMOUNT_MIN = 5 * LAKH
PROJECT_AMOUNT_MAX = 1 * CRORE

# Amounts rounded to nearest ₹10,000
AMOUNT_STEP = 10_000


# ============================================================
# STATES
# ============================================================

STATES = [
    "Maharashtra",
    "Karnataka",
    "Gujarat",
    "Bihar",
    "Madhya Pradesh",
    "Rajasthan",
    "Uttar Pradesh",
    "Telangana",
    "Tamil Nadu",
    "West Bengal"
]


DISTRICTS = {
    "Maharashtra": [
        "Pune", "Solapur", "Nanded", "Hingoli", "Nagpur",
        "Nashik", "Kolhapur", "Satara", "Sangli", "Latur"
    ],

    "Karnataka": [
        "Belagavi", "Hubballi", "Dharwad", "Mysuru",
        "Bengaluru", "Ballari", "Kalaburagi"
    ],

    "Gujarat": [
        "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"
    ],

    "Bihar": [
        "Patna", "Gaya", "Aurangabad", "Bhagalpur", "Muzaffarpur"
    ],

    "Madhya Pradesh": [
        "Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain"
    ],

    "Rajasthan": [
        "Jaipur", "Jodhpur", "Kota", "Ajmer", "Udaipur"
    ],

    "Uttar Pradesh": [
        "Lucknow", "Kanpur", "Agra", "Varanasi", "Prayagraj"
    ],

    "Telangana": [
        "Hyderabad", "Warangal", "Nizamabad", "Karimnagar"
    ],

    "Tamil Nadu": [
        "Chennai", "Madurai", "Coimbatore",
        "Salem", "Tiruchirappalli"
    ],

    "West Bengal": [
        "Kolkata", "Howrah", "Durgapur", "Siliguri"
    ]
}


# ============================================================
# PROJECT CATEGORIES
# ============================================================

PROJECT_CATEGORIES = [
    "Road",
    "Water Supply",
    "Education",
    "Healthcare",
    "Sanitation",
    "Community Development",
    "Electricity",
    "Public Infrastructure",
    "Agriculture",
    "Sports"
]


PROJECT_DESCRIPTIONS = {
    "Road": [
        "Village road construction",
        "Internal road development",
        "Road repair and improvement",
        "Rural connectivity road"
    ],

    "Water Supply": [
        "Construction of water tank",
        "Pipeline installation",
        "Drinking water facility",
        "Water supply improvement"
    ],

    "Education": [
        "School classroom construction",
        "School laboratory development",
        "School infrastructure improvement",
        "Library construction"
    ],

    "Healthcare": [
        "Primary health centre development",
        "Medical equipment purchase",
        "Health centre infrastructure",
        "Community health facility"
    ],

    "Sanitation": [
        "Community toilet construction",
        "Drainage improvement",
        "Waste management facility",
        "Sanitation infrastructure"
    ],

    "Community Development": [
        "Community hall construction",
        "Public facility development",
        "Village development work"
    ],

    "Electricity": [
        "Street lighting installation",
        "Electricity infrastructure",
        "Solar lighting installation"
    ],

    "Public Infrastructure": [
        "Public building construction",
        "Public facility improvement",
        "Infrastructure development"
    ],

    "Agriculture": [
        "Agricultural storage facility",
        "Irrigation development",
        "Farmer support infrastructure"
    ],

    "Sports": [
        "Sports ground development",
        "Community sports facility",
        "Playground construction"
    ]
}


# ============================================================
# DATE HELPERS
# ============================================================

START_DATE = datetime(2025, 1, 1)
END_DATE = datetime(2025, 8, 31)


def random_dates(size, start=START_DATE, end=END_DATE):
    """
    Generate random dates efficiently using NumPy.
    """

    start_ts = np.datetime64(start.date())
    end_ts = np.datetime64(end.date())

    days = (
        end_ts - start_ts
    ).astype("timedelta64[D]").astype(int)

    random_days = np.random.randint(
        0,
        days + 1,
        size=size
    )

    return pd.to_datetime(
        start_ts + random_days.astype("timedelta64[D]")
    )


# ============================================================
# MONEY HELPER
# ============================================================

def generate_project_amounts(count):
    """
    Generate project amounts between ₹5 lakh and ₹1 crore.

    Amounts are rounded to nearest ₹10,000.
    """

    min_units = PROJECT_AMOUNT_MIN // AMOUNT_STEP
    max_units = PROJECT_AMOUNT_MAX // AMOUNT_STEP

    amounts = np.random.randint(
        min_units,
        max_units + 1,
        size=count
    ) * AMOUNT_STEP

    return amounts.astype(np.int64)


def format_inr(amount):
    """
    Convert amount into readable Indian format.
    """

    if amount >= CRORE:
        return f"₹{amount / CRORE:.2f} crore"

    return f"₹{amount / LAKH:.2f} lakh"


# ============================================================
# WRITE CSV CHUNK
# ============================================================

def write_chunk(df, filename, first_chunk):

    path = os.path.join(
        OUTPUT_DIR,
        filename
    )

    df.to_csv(
        path,
        mode="w" if first_chunk else "a",
        header=first_chunk,
        index=False
    )


# ============================================================
# 1. MP ALLOCATION
# ============================================================

def generate_mps():

    rows = []

    for i in range(1, NUM_MPS + 1):

        mp_id = f"MP{i:04d}"

        state = random.choice(STATES)

        district = random.choice(
            DISTRICTS[state]
        )

        constituency = (
            f"{district.upper()}-{random.randint(1, 5)}"
        )

        allocated_amount = random.choice([
            10 * CRORE,
            12 * CRORE,
            14.7 * CRORE,
            15 * CRORE,
            17.5 * CRORE,
            19 * CRORE
        ])

        rows.append({
            "MP_ID": mp_id,
            "State": state,
            "MP_Name": f"MP Representative {i:04d}",
            "Constituency": constituency,
            "Allocated_Amount": int(allocated_amount),
            "Financial_Year": "2025-26"
        })

    df = pd.DataFrame(rows)

    write_chunk(
        df,
        "mp_allocation.csv",
        True
    )

    return df


# ============================================================
# 2. VENDORS
# ============================================================

def generate_vendors():

    rows = []

    # Some vendors intentionally share bank accounts.
    # This creates graph relationships useful for
    # anomaly/fraud detection.

    for i in range(1, NUM_VENDORS + 1):

        vendor_id = f"V{i:06d}"

        state = random.choice(STATES)

        district = random.choice(
            DISTRICTS[state]
        )

        if i <= 1000:

            bank_account = (
                f"BANK{random.randint(1, 100):06d}"
            )

        else:

            bank_account = (
                f"BANK{i:06d}"
            )

        rows.append({
            "Vendor_ID": vendor_id,
            "Vendor_Name": f"Contractor Company {i:06d}",
            "Registration_ID": f"REG{i:07d}",
            "State": state,
            "District": district,
            "Bank_Account_ID": bank_account,
            "Vendor_Address": f"{district}, {state}"
        })

    df = pd.DataFrame(rows)

    write_chunk(
        df,
        "vendors.csv",
        True
    )

    return df


# ============================================================
# 3. PROJECT CHUNK GENERATOR
# ============================================================

def generate_project_chunk(
    start_id,
    count,
    mp_df,
    vendor_df
):

    project_numbers = np.arange(
        start_id,
        start_id + count
    )

    project_ids = [
        f"P{x:08d}"
        for x in project_numbers
    ]


    # --------------------------------------------------------
    # Random MP assignment
    # --------------------------------------------------------

    mp_indexes = np.random.randint(
        0,
        len(mp_df),
        size=count
    )

    mp_ids = mp_df.iloc[
        mp_indexes
    ]["MP_ID"].to_numpy()

    states = mp_df.iloc[
        mp_indexes
    ]["State"].to_numpy()

    constituencies = mp_df.iloc[
        mp_indexes
    ]["Constituency"].to_numpy()


    # --------------------------------------------------------
    # Vendor assignment
    # --------------------------------------------------------

    vendor_indexes = np.random.randint(
        0,
        len(vendor_df),
        size=count
    )

    vendor_ids = vendor_df.iloc[
        vendor_indexes
    ]["Vendor_ID"].to_numpy()


    # --------------------------------------------------------
    # Categories
    # --------------------------------------------------------

    categories = np.random.choice(
        PROJECT_CATEGORIES,
        size=count
    )

    descriptions = [
        random.choice(
            PROJECT_DESCRIPTIONS[category]
        )
        for category in categories
    ]


    # --------------------------------------------------------
    # MONEY
    # --------------------------------------------------------

    sanctioned_amount = generate_project_amounts(
        count
    )


    # --------------------------------------------------------
    # Dates
    # --------------------------------------------------------

    sanction_dates = random_dates(
        count
    )

    expected_days = np.random.randint(
        90,
        271,
        size=count
    )

    expected_dates = (
        sanction_dates
        + pd.to_timedelta(
            expected_days,
            unit="D"
        )
    )


    # --------------------------------------------------------
    # Suspicious projects
    # --------------------------------------------------------

    suspicious = (
        np.random.random(count)
        < FRAUD_RATE
    )


    # --------------------------------------------------------
    # Status
    # --------------------------------------------------------

    statuses = np.where(
        suspicious,

        np.random.choice(
            [
                "Delayed",
                "Completed",
                "Ongoing"
            ],
            size=count
        ),

        np.where(
            np.random.random(count) < 0.75,
            "Completed",
            "Ongoing"
        )
    )


    # --------------------------------------------------------
    # Actual completion
    # --------------------------------------------------------

    actual_dates = []

    for i in range(count):

        if statuses[i] == "Ongoing":

            actual_dates.append("")

        elif suspicious[i]:

            delay = random.randint(
                30,
                180
            )

            date = (
                expected_dates[i]
                + pd.Timedelta(
                    days=delay
                )
            )

            actual_dates.append(
                date.strftime("%Y-%m-%d")
            )

        else:

            early = random.randint(
                1,
                30
            )

            date = (
                expected_dates[i]
                - pd.Timedelta(
                    days=early
                )
            )

            actual_dates.append(
                date.strftime("%Y-%m-%d")
            )


    # --------------------------------------------------------
    # DataFrame
    # --------------------------------------------------------

    df = pd.DataFrame({

        "Project_ID":
            project_ids,

        "MP_ID":
            mp_ids,

        "State":
            states,

        "Constituency":
            constituencies,

        "Project_Category":
            categories,

        "Project_Description":
            descriptions,

        "Sanctioned_Amount":
            sanctioned_amount,

        "Sanction_Date":
            sanction_dates.strftime(
                "%Y-%m-%d"
            ),

        "Expected_Completion_Date":
            expected_dates.strftime(
                "%Y-%m-%d"
            ),

        "Actual_Completion_Date":
            actual_dates,

        "Contractor_ID":
            vendor_ids,

        "Project_Status":
            statuses
    })

    # Keep suspicious information internally available
    # for generation of other tables.
    df["_Suspicious"] = suspicious

    return df


# ============================================================
# 4. PAYMENTS
# ============================================================

def generate_payment_chunk(
    project_df,
    payment_start
):

    rows = []

    payment_counter = payment_start

    for _, project in project_df.iterrows():

        sanctioned = int(
            project["Sanctioned_Amount"]
        )

        project_id = project[
            "Project_ID"
        ]

        vendor_id = project[
            "Contractor_ID"
        ]

        sanction_date = datetime.strptime(
            project["Sanction_Date"],
            "%Y-%m-%d"
        )

        # 1-3 payments
        num_payments = random.choice([
            1,
            2,
            2,
            3
        ])

        remaining = sanctioned

        for payment_num in range(
            num_payments
        ):

            if payment_num == num_payments - 1:

                amount = remaining

            else:

                amount = int(
                    remaining
                    * random.uniform(
                        0.30,
                        0.60
                    )
                )

                amount = max(
                    amount,
                    50000
                )

            amount = min(
                amount,
                remaining
            )

            remaining -= amount

            payment_date = (
                sanction_date
                + pd.Timedelta(
                    days=random.randint(
                        15,
                        180
                    )
                )
            )

            if payment_num == 0:

                payment_type = (
                    "First Installment"
                )

            elif payment_num == num_payments - 1:

                payment_type = (
                    "Final Installment"
                )

            else:

                payment_type = (
                    "Intermediate Installment"
                )

            rows.append({

                "Payment_ID":
                    f"PAY{payment_counter:09d}",

                "Project_ID":
                    project_id,

                "Vendor_ID":
                    vendor_id,

                "Invoice_ID":
                    f"INV{payment_counter:09d}",

                "Payment_Date":
                    payment_date.strftime(
                        "%Y-%m-%d"
                    ),

                "Payment_Amount":
                    amount,

                "Payment_Type":
                    payment_type
            })

            payment_counter += 1

            if remaining <= 0:
                break

    return pd.DataFrame(rows)


# ============================================================
# 5. UTILIZATION
# ============================================================

def generate_utilization_chunk(
    project_df
):

    count = len(project_df)

    suspicious = (
        project_df["_Suspicious"]
        .to_numpy()
    )

    sanctioned = (
        project_df[
            "Sanctioned_Amount"
        ]
        .to_numpy()
    )

    actual = np.where(

        suspicious,

        sanctioned
        * np.random.uniform(
            0.40,
            0.75,
            size=count
        ),

        sanctioned
        * np.random.uniform(
            0.75,
            1.00,
            size=count
        )

    ).astype(int)


    claimed = np.where(

        suspicious,

        sanctioned
        * np.random.uniform(
            0.90,
            1.00,
            size=count
        ),

        np.minimum(
            sanctioned,
            actual
            * np.random.uniform(
                1.00,
                1.08,
                size=count
            )
        )

    ).astype(int)


    completion = np.where(

        suspicious,

        np.random.randint(
            40,
            76,
            size=count
        ),

        np.random.randint(
            80,
            101,
            size=count
        )
    )


    status = np.where(

        suspicious,

        np.where(
            np.random.random(count) < 0.6,
            "Suspicious",
            "Under Review"
        ),

        np.where(
            np.random.random(count) < 0.75,
            "Verified",
            "Under Review"
        )
    )


    sanction_dates = pd.to_datetime(
        project_df["Sanction_Date"]
    )

    submission_dates = (
        sanction_dates
        + pd.to_timedelta(
            np.random.randint(
                100,
                301,
                size=count
            ),
            unit="D"
        )
    )


    return pd.DataFrame({

        "UC_ID": [
            f"UC{int(x[1:]):08d}"
            for x in project_df["Project_ID"]
        ],

        "Project_ID":
            project_df["Project_ID"].to_numpy(),

        "UC_Submission_Date":
                submission_dates.dt.strftime("%Y-%m-%d"),

        "Claimed_Utilized_Amount":
            claimed,

        "Actual_Utilized_Amount":
            actual,

        "Completion_Percentage":
            completion,

        "UC_Status":
            status
    })


# ============================================================
# 6. PHOTO EVIDENCE
# ============================================================

def generate_photo_chunk(
    project_df
):

    count = len(project_df)

    project_numbers = np.array([
        int(x[1:])
        for x in project_df["Project_ID"]
    ])

    suspicious = (
        np.random.random(count)
        < FRAUD_RATE
    )


    latitude = np.random.uniform(
        8.0,
        35.0,
        size=count
    )

    longitude = np.random.uniform(
        68.0,
        97.0,
        size=count
    )


    claimed_latitude = latitude.copy()

    claimed_longitude = longitude.copy()


    gps_distance = np.random.uniform(
        0.01,
        0.50,
        size=count
    )


    # --------------------------------------------------------
    # GPS anomalies
    # --------------------------------------------------------

    suspicious_indexes = np.where(
        suspicious
    )[0]


    claimed_latitude[
        suspicious_indexes
    ] += np.random.uniform(
        0.3,
        1.2,
        size=len(suspicious_indexes)
    )


    claimed_longitude[
        suspicious_indexes
    ] += np.random.uniform(
        0.3,
        1.2,
        size=len(suspicious_indexes)
    )


    gps_distance[
        suspicious_indexes
    ] = np.random.uniform(
        20,
        150,
        size=len(suspicious_indexes)
    )


    # --------------------------------------------------------
    # Photo hashes
    # --------------------------------------------------------

    photo_hashes = [
        hashlib.sha256(
            f"PHOTO-{x}".encode()
        ).hexdigest()[:16]
        for x in project_numbers
    ]


    duplicate_flags = np.full(
        count,
        "No",
        dtype=object
    )


    gps_verification = np.full(
        count,
        "Verified",
        dtype=object
    )


    gps_verification[
        suspicious_indexes
    ] = "Mismatch"


    # Some suspicious photos are duplicates.
    duplicate_count = int(
        len(suspicious_indexes)
        * 0.30
    )


    if duplicate_count > 0:

        duplicate_indexes = np.random.choice(
            suspicious_indexes,
            size=duplicate_count,
            replace=False
        )


        duplicate_flags[
            duplicate_indexes
        ] = "Yes"


        gps_verification[
            duplicate_indexes
        ] = "Duplicate"


        # Duplicate hashes
        for idx in duplicate_indexes:

            source = random.randint(
                0,
                len(photo_hashes) - 1
            )

            photo_hashes[idx] = (
                photo_hashes[source]
            )


    # --------------------------------------------------------
    # Photo dates
    # --------------------------------------------------------

    sanction_dates = pd.to_datetime(
        project_df["Sanction_Date"]
    )

    photo_dates = (
        sanction_dates
        + pd.to_timedelta(
            np.random.randint(
                30,
                251,
                size=count
            ),
            unit="D"
        )
    )


    return pd.DataFrame({

        "Photo_ID": [
            f"PH{x:08d}"
            for x in project_numbers
        ],

        "Project_ID":
            project_df["Project_ID"].to_numpy(),

        # DatetimeIndex/DatetimeArray uses .strftime()
        "Photo_Date":
            photo_dates.dt.strftime(
                "%Y-%m-%d"
            ),

        "Latitude":
            np.round(
                latitude,
                6
            ),

        "Longitude":
            np.round(
                longitude,
                6
            ),

        "Claimed_Latitude":
            np.round(
                claimed_latitude,
                6
            ),

        "Claimed_Longitude":
            np.round(
                claimed_longitude,
                6
            ),

        "GPS_Distance_KM":
            np.round(
                gps_distance,
                2
            ),

        "Photo_Hash":
            photo_hashes,

        "Duplicate_Photo_Flag":
            duplicate_flags,

        "GPS_Verification":
            gps_verification
    })


# ============================================================
# 7. RELATIONSHIPS
# ============================================================

def generate_relationship_chunk(
    project_df
):

    mp_relationships = pd.DataFrame({

        "Source_ID":
            project_df["MP_ID"].to_numpy(),

        "Source_Type":
            "MP",

        "Relationship":
            "Allocated",

        "Target_ID":
            project_df["Project_ID"].to_numpy(),

        "Target_Type":
            "Project"
    })


    vendor_relationships = pd.DataFrame({

        "Source_ID":
            project_df["Project_ID"].to_numpy(),

        "Source_Type":
            "Project",

        "Relationship":
            "Assigned_To",

        "Target_ID":
            project_df["Contractor_ID"].to_numpy(),

        "Target_Type":
            "Vendor"
    })


    return pd.concat(
        [
            mp_relationships,
            vendor_relationships
        ],
        ignore_index=True
    )


# ============================================================
# 8. RISK SCORES
# ============================================================

def generate_risk_chunk(
    project_df,
    utilization_df,
    photo_df
):

    count = len(project_df)


    # --------------------------------------------------------
    # Utilization risk
    # --------------------------------------------------------

    claimed = (
        utilization_df[
            "Claimed_Utilized_Amount"
        ]
        .to_numpy()
    )

    actual = (
        utilization_df[
            "Actual_Utilized_Amount"
        ]
        .to_numpy()
    )


    utilization_difference = (
        claimed - actual
    ) / np.maximum(
        claimed,
        1
    )


    utilization_risk = np.clip(

        (
            utilization_difference
            * 100
        ).astype(int),

        0,
        100
    )


    # --------------------------------------------------------
    # Photo risk
    # --------------------------------------------------------

    photo_risk = np.zeros(
        count,
        dtype=int
    )


    mismatch = (
        photo_df[
            "GPS_Verification"
        ]
        == "Mismatch"
    ).to_numpy()


    duplicate = (
        photo_df[
            "Duplicate_Photo_Flag"
        ]
        == "Yes"
    ).to_numpy()


    photo_risk += (
        mismatch.astype(int)
        * 70
    )


    photo_risk += (
        duplicate.astype(int)
        * 30
    )


    photo_risk = np.minimum(
        photo_risk,
        100
    )


    # --------------------------------------------------------
    # ML anomaly score
    # --------------------------------------------------------

    ml_score = np.random.randint(
        5,
        36,
        size=count
    )


    high_utilization = (
        utilization_risk > 40
    )


    ml_score[
        high_utilization
    ] += np.random.randint(
        25,
        56,
        size=high_utilization.sum()
    )


    ml_score = np.minimum(
        ml_score,
        100
    )


    # --------------------------------------------------------
    # Graph risk
    # --------------------------------------------------------

    graph_score = np.random.randint(
        5,
        36,
        size=count
    )


    graph_suspicious = (
        np.random.random(count)
        < 0.12
    )


    graph_score[
        graph_suspicious
    ] += np.random.randint(
        30,
        61,
        size=graph_suspicious.sum()
    )


    graph_score = np.minimum(
        graph_score,
        100
    )


    # --------------------------------------------------------
    # Work splitting
    # --------------------------------------------------------

    work_splitting = np.random.randint(
        5,
        36,
        size=count
    )


    # --------------------------------------------------------
    # Vendor concentration
    # --------------------------------------------------------

    vendor_concentration = np.random.randint(
        5,
        36,
        size=count
    )


    vendor_suspicious = (
        np.random.random(count)
        < 0.10
    )


    vendor_concentration[
        vendor_suspicious
    ] += np.random.randint(
        30,
        61,
        size=vendor_suspicious.sum()
    )


    vendor_concentration = np.minimum(
        vendor_concentration,
        100
    )


    # --------------------------------------------------------
    # Final score
    # --------------------------------------------------------

    final_score = (

        (
            ml_score
            + graph_score
            + photo_risk
            + work_splitting
            + vendor_concentration
            + utilization_risk
        ) / 6

    ).astype(int)


    risk_level = np.where(

        final_score >= 65,

        "High",

        np.where(
            final_score >= 35,
            "Medium",
            "Low"
        )
    )


    return pd.DataFrame({

        "Project_ID":
            project_df["Project_ID"].to_numpy(),

        "ML_Anomaly_Score":
            ml_score,

        "Graph_Risk_Score":
            graph_score,

        "Photo_Risk_Score":
            photo_risk,

        "Work_Splitting_Score":
            work_splitting,

        "Vendor_Concentration_Score":
            vendor_concentration,

        "Utilization_Risk_Score":
            utilization_risk,

        "Final_Risk_Score":
            final_score,

        "Risk_Level":
            risk_level
    })


# ============================================================
# 9. AUDIT DECISIONS
# ============================================================

def generate_audit_chunk(
    risk_df,
    project_start
):
    count = len(risk_df)

    scores = (
        risk_df[
            "Final_Risk_Score"
        ]
        .to_numpy()
    )

    decisions = np.where(
        scores >= 65,
        "Escalated",
        np.where(
            scores >= 35,
            "Hold",
            "Approved"
        )
    )

    high_reasons = [
        "High anomaly score detected",
        "Multiple fraud indicators detected",
        "High utilization risk detected",
        "Suspicious evidence requires investigation",
        "High graph and vendor risk detected"
    ]

    medium_reasons = [
        "Project requires verification",
        "Utilization amount requires review",
        "Moderate anomaly detected",
        "Vendor activity requires verification"
    ]

    low_reasons = [
        "No significant anomaly detected",
        "Project evidence verified",
        "Low risk detected",
        "Documents and evidence verified"
    ]

    reasons = []

    for decision in decisions:
        if decision == "Escalated":
            reasons.append(
                random.choice(high_reasons)
            )
        elif decision == "Hold":
            reasons.append(
                random.choice(medium_reasons)
            )
        else:
            reasons.append(
                random.choice(low_reasons)
            )

    audit_dates = (
        pd.Timestamp("2025-09-01")
        + pd.to_timedelta(
            np.random.randint(
                0,
                151,
                size=count
            ),
            unit="D"
        )
    )

    project_numbers = np.arange(
        project_start,
        project_start + count
    )

    return pd.DataFrame({
        "Audit_ID": [
            f"AUD{x:08d}"
            for x in project_numbers
        ],

        "Project_ID":
            risk_df["Project_ID"].to_numpy(),

        "Risk_Score":
            scores,

        "Auditor_ID": [
            f"AUDITOR{random.randint(1, 500):04d}"
            for _ in range(count)
        ],

        "Auditor_Decision":
            decisions,

        "Reason":
            reasons,

        "Audit_Date":
            audit_dates.strftime(
                "%Y-%m-%d"
            ),

        "Blockchain_Hash": [
            hashlib.sha256(
                f"BLOCK-{x}".encode()
            ).hexdigest()
            for x in project_numbers
        ]
    })


# ============================================================
# MAIN
# ============================================================

def main():

    os.makedirs(
        OUTPUT_DIR,
        exist_ok=True
    )


    print("=" * 70)

    print(
        "MPLADS SYNTHETIC DATA GENERATOR"
    )

    print("=" * 70)


    print(
        f"\nProjects requested : {NUM_PROJECTS:,}"
    )

    print(
        f"Chunk size         : {CHUNK_SIZE:,}"
    )

    print(
        f"Fraud/anomaly rate : {FRAUD_RATE * 100:.1f}%"
    )

    print(
        f"Project amount     : "
        f"{format_inr(PROJECT_AMOUNT_MIN)} "
        f"to "
        f"{format_inr(PROJECT_AMOUNT_MAX)}"
    )

    print(
        f"Output directory   : {OUTPUT_DIR}/"
    )

    print("=" * 70)


    # --------------------------------------------------------
    # Generate small master datasets
    # --------------------------------------------------------

    print(
        "\n[1/9] Generating MP allocation..."
    )

    mp_df = generate_mps()

    print(
        f"       {len(mp_df):,} MP records"
    )


    print(
        "\n[2/9] Generating vendors..."
    )

    vendor_df = generate_vendors()

    print(
        f"       {len(vendor_df):,} vendor records"
    )


    # --------------------------------------------------------
    # Remove old large CSV files
    # --------------------------------------------------------

    output_files = [

        "projects.csv",
        "payments.csv",
        "utilization.csv",
        "photo_evidence.csv",
        "relationships.csv",
        "risk_scores.csv",
        "audit_decisions.csv"
    ]


    for filename in output_files:

        path = os.path.join(
            OUTPUT_DIR,
            filename
        )

        if os.path.exists(path):
            os.remove(path)


    # --------------------------------------------------------
    # Counters
    # --------------------------------------------------------

    total_projects = 0
    total_payments = 0
    total_relationships = 0

    payment_counter = 1


    # --------------------------------------------------------
    # Process projects in chunks
    # --------------------------------------------------------

    print(
        "\nStarting data generation...\n"
    )


    chunk_number = 0


    for start in range(
        1,
        NUM_PROJECTS + 1,
        CHUNK_SIZE
    ):

        chunk_number += 1


        end = min(
            start + CHUNK_SIZE - 1,
            NUM_PROJECTS
        )


        current_size = (
            end - start + 1
        )


        print(
            f"Chunk {chunk_number:04d} | "
            f"Projects "
            f"{start:,} - {end:,}"
        )


        # ====================================================
        # PROJECTS
        # ====================================================

        project_df = generate_project_chunk(

            start,
            current_size,
            mp_df,
            vendor_df
        )


        write_chunk(

            project_df.drop(
                columns=["_Suspicious"]
            ),

            "projects.csv",

            chunk_number == 1
        )


        # ====================================================
        # PAYMENTS
        # ====================================================

        payment_df = generate_payment_chunk(

            project_df,
            payment_counter
        )


        payment_counter += len(
            payment_df
        )


        total_payments += len(
            payment_df
        )


        write_chunk(

            payment_df,

            "payments.csv",

            chunk_number == 1
        )


        # ====================================================
        # UTILIZATION
        # ====================================================

        utilization_df = (
            generate_utilization_chunk(
                project_df
            )
        )


        write_chunk(

            utilization_df,

            "utilization.csv",

            chunk_number == 1
        )


        # ====================================================
        # PHOTO EVIDENCE
        # ====================================================

        photo_df = generate_photo_chunk(
            project_df
        )


        write_chunk(

            photo_df,

            "photo_evidence.csv",

            chunk_number == 1
        )


        # ====================================================
        # RELATIONSHIPS
        # ====================================================

        relationship_df = (
            generate_relationship_chunk(
                project_df
            )
        )


        total_relationships += len(
            relationship_df
        )


        write_chunk(

            relationship_df,

            "relationships.csv",

            chunk_number == 1
        )


        # ====================================================
        # RISK SCORES
        # ====================================================

        risk_df = generate_risk_chunk(

            project_df,
            utilization_df,
            photo_df
        )


        write_chunk(

            risk_df,

            "risk_scores.csv",

            chunk_number == 1
        )


        # ====================================================
        # AUDIT DECISIONS
        # ====================================================

        audit_df = generate_audit_chunk(

            risk_df,
            start
        )


        write_chunk(

            audit_df,

            "audit_decisions.csv",

            chunk_number == 1
        )


        # ====================================================
        # Progress
        # ====================================================

        total_projects += current_size


        percent = (

            total_projects
            / NUM_PROJECTS

        ) * 100


        print(

            f"           Progress : "
            f"{percent:6.2f}% | "
            f"Payments : "
            f"{total_payments:,} | "
            f"Relationships : "
            f"{total_relationships:,}"

        )


        # Explicitly release chunk memory

        del project_df
        del payment_df
        del utilization_df
        del photo_df
        del relationship_df
        del risk_df
        del audit_df


    # --------------------------------------------------------
    # Final summary
    # --------------------------------------------------------

    print("\n")

    print("=" * 70)

    print(
        "DATA GENERATION COMPLETE"
    )

    print("=" * 70)


    print(
        f"\nMP allocations     : "
        f"{NUM_MPS:,}"
    )

    print(
        f"Vendors            : "
        f"{NUM_VENDORS:,}"
    )

    print(
        f"Projects           : "
        f"{total_projects:,}"
    )

    print(
        f"Payments           : "
        f"{total_payments:,}"
    )

    print(
        f"Utilization        : "
        f"{total_projects:,}"
    )

    print(
        f"Photo evidence     : "
        f"{total_projects:,}"
    )

    print(
        f"Relationships      : "
        f"{total_relationships:,}"
    )

    print(
        f"Risk scores        : "
        f"{total_projects:,}"
    )

    print(
        f"Audit decisions    : "
        f"{total_projects:,}"
    )


    print("\nFiles created:")


    for filename in [

        "mp_allocation.csv",
        "vendors.csv",
        "projects.csv",
        "payments.csv",
        "utilization.csv",
        "photo_evidence.csv",
        "relationships.csv",
        "risk_scores.csv",
        "audit_decisions.csv"

    ]:

        path = os.path.join(
            OUTPUT_DIR,
            filename
        )


        if os.path.exists(path):

            size_mb = (

                os.path.getsize(path)
                / (1024 * 1024)

            )


            print(

                f"  {filename:<25} "
                f"{size_mb:,.2f} MB"

            )


    print("\nDone! 🚀")

    print("=" * 70)


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()

