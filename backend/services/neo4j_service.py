import os
from neo4j import GraphDatabase
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("mplads.neo4j")

class Neo4jService:
    def __init__(self):
        self.driver = None
        uri = os.getenv("NEO4J_URI")
        user = os.getenv("NEO4J_USER")
        password = os.getenv("NEO4J_PASSWORD")
        if uri and user and password:
            self.connect(uri, user, password)
        else:
            print("[NEO4J] Warning: Neo4j credentials not found in .env")

    def connect(self, uri: str, user: str, password: str):
        try:
            self.driver = GraphDatabase.driver(uri, auth=(user, password))
            # Verify connectivity
            self.driver.verify_connectivity()
            logger.info("[NEO4J] Successfully connected to AuraDB")
            print("[NEO4J-ENGINE] Successfully connected to Aura Cloud Graph")
        except Exception as e:
            logger.error(f"[NEO4J] Connection failed: {e}")
            print(f"[NEO4J-ENGINE] ERROR: Could not connect to AuraDB: {e}")

    def close(self):
        if self.driver:
            self.driver.close()

    def run_query(self, query: str, parameters=None):
        if not self.driver:
            print("[NEO4J-ENGINE] Warning: Driver not initialized.")
            return []
        
        with self.driver.session() as session:
            result = session.run(query, parameters)
            return [record.data() for record in result]

    def map_evidence_upload(self, contractor_name: str, ip_address: str, project_id: int):
        """
        Creates the graph nodes when a contractor uploads evidence.
        """
        query = """
        MERGE (c:Contractor {name: $contractor})
        MERGE (p:Project {id: $project_id})
        MERGE (ip:IP_Address {address: $ip_address})
        MERGE (c)-[:UPLOADED_EVIDENCE_FOR]->(p)
        MERGE (c)-[:USED_IP]->(ip)
        """
        self.run_query(query, {
            "contractor": contractor_name,
            "project_id": project_id,
            "ip_address": ip_address
        })

    def detect_ip_syndicate(self, ip_address: str):
        """
        Detects if multiple contractors are using the exact same IP address.
        """
        query = """
        MATCH (c1:Contractor)-[:USED_IP]->(ip:IP_Address {address: $ip_address})<-[:USED_IP]-(c2:Contractor)
        WHERE elementId(c1) < elementId(c2)
        RETURN c1.name AS Contractor1, c2.name AS Contractor2, ip.address AS IP
        """
        return self.run_query(query, {"ip_address": ip_address})

# Singleton instance
neo4j_service = Neo4jService()

