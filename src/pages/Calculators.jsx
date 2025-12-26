import React, { useState } from "react";
import styles from "./Calculators.module.css";
import FDCalculator from "../components/calculators/FDCalculator";
import SIPCalculator from "../components/calculators/SIPCalculator";
import SWPCalculator from "../components/calculators/SWPCalculator";
import EMICalculator from "../components/calculators/EMICalculator";
import NPSCalculator from "../components/calculators/NPSCalculator";
import RDCalculator from "../components/calculators/RDCalculator";
import GSTCalculator from "../components/calculators/GSTCalculator";
import CorpusCalculator from "../components/calculators/CorpusCalculator";

const Calculators = () => {
    const [activeTab, setActiveTab] = useState("FD"); // Default active tab

    return (
        <div className={styles.pageContainer}>
            <div className={styles.contentWrapper}>
                <h1 className={styles.mainHeading}>CALCULATOR</h1>

                {/* Top Selector Section (The "Toggle Sections") */}
                <div className={styles.calculatorSelectorArea}>

                    {/* The Grid of Boxes for Selection */}
                    <div className={styles.toolsGrid}>
                        {/* Row 1 */}
                        {/* 1. FD */}
                        <div
                            className={`${styles.toolBox} ${activeTab === "FD" ? styles.activeBox : ""}`}
                            onClick={() => setActiveTab("FD")}
                        >
                            <span className={styles.boxLabel}>FD Calculation</span>
                        </div>

                        {/* 2. SIP */}
                        <div
                            className={`${styles.toolBox} ${activeTab === "SIP" ? styles.activeBox : ""}`}
                            onClick={() => setActiveTab("SIP")}
                        >
                            <span className={styles.boxLabel}>SIP Calculation</span>
                        </div>

                        {/* 3. SWP */}
                        <div
                            className={`${styles.toolBox} ${activeTab === "SWP" ? styles.activeBox : ""}`}
                            onClick={() => setActiveTab("SWP")}
                        >
                            <span className={styles.boxLabel}>SWP Calculation</span>
                        </div>

                        {/* 4. EMI */}
                        <div
                            className={`${styles.toolBox} ${activeTab === "EMI" ? styles.activeBox : ""}`}
                            onClick={() => setActiveTab("EMI")}
                        >
                            <span className={styles.boxLabel}>EMI Calculation</span>
                        </div>

                        {/* Row 2 */}
                        {/* 5. NPS */}
                        <div
                            className={`${styles.toolBox} ${activeTab === "NPS" ? styles.activeBox : ""}`}
                            onClick={() => setActiveTab("NPS")}
                        >
                            <span className={styles.boxLabel}>NPS Calculation</span>
                        </div>

                        {/* 6. RD */}
                        <div
                            className={`${styles.toolBox} ${activeTab === "RD" ? styles.activeBox : ""}`}
                            onClick={() => setActiveTab("RD")}
                        >
                            <span className={styles.boxLabel}>RD Calculation</span>
                        </div>

                        {/* 7. GST */}
                        <div
                            className={`${styles.toolBox} ${activeTab === "GST" ? styles.activeBox : ""}`}
                            onClick={() => setActiveTab("GST")}
                        >
                            <span className={styles.boxLabel}>GST Calculation</span>
                        </div>

                        {/* 8. Corpus */}
                        <div
                            className={`${styles.toolBox} ${activeTab === "Corpus" ? styles.activeBox : ""}`}
                            onClick={() => setActiveTab("Corpus")}
                        >
                            <span className={styles.boxLabel}>Corpus Calculation</span>
                        </div>

                    </div>
                </div>

                {/* Main Calculator Display Section (Below the toggles) */}
                <div className={styles.calculatorSection}>
                    {activeTab === "FD" && <FDCalculator />}
                    {activeTab === "SIP" && <SIPCalculator />}
                    {activeTab === "SWP" && <SWPCalculator />}
                    {activeTab === "EMI" && <EMICalculator />}
                    {activeTab === "NPS" && <NPSCalculator />}
                    {activeTab === "RD" && <RDCalculator />}
                    {activeTab === "GST" && <GSTCalculator />}
                    {activeTab === "Corpus" && <CorpusCalculator />}

                    {activeTab !== "FD" && activeTab !== "SIP" && activeTab !== "SWP" && activeTab !== "EMI" && activeTab !== "NPS" && activeTab !== "RD" && activeTab !== "GST" && activeTab !== "Corpus" && (
                        <div className={styles.emptyStateSection}>
                            <p>Coming Soon</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Calculators;
