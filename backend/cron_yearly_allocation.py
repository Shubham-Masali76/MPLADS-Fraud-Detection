import sqlite3
import datetime

# This script would be configured to run automatically on April 1st every year (Start of Financial Year)
# using a tool like Cron (Linux) or Windows Task Scheduler.

DB_PATH = "./live_workflow.db"
ANNUAL_ALLOCATION = 50000000.0  # 5 Crore

def execute_yearly_rollover():
    print(f"[{datetime.datetime.now()}] STARTING ANNUAL MPLADS FUND DISBURSAL BATCH JOB...")
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # 1. Check if the table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='live_mp_wallets';")
        if not cursor.fetchone():
            print("ERROR: live_mp_wallets table not found. Skipping rollover.")
            return

        # 2. Add 5 Crore to EVERY MP's wallet.
        # Because funds are non-lapsable, whatever unspent balance they have from last year
        # is automatically preserved. We just add the new year's 5 Cr on top of it.
        cursor.execute(f"UPDATE live_mp_wallets SET total_allocated_funds = total_allocated_funds + {ANNUAL_ALLOCATION}")
        
        # Get count of updated MPs
        updated_count = cursor.rowcount
        conn.commit()
        
        print(f"[{datetime.datetime.now()}] SUCCESS: Deposited {ANNUAL_ALLOCATION / 10000000} Cr to {updated_count} MP Wallets.")
        
    except Exception as e:
        print(f"[{datetime.datetime.now()}] CRITICAL ERROR during fund rollover: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    execute_yearly_rollover()

