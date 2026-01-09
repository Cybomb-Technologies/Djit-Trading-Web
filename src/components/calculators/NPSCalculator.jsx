import React, { useState } from "react";
import { Form, Row, Col, Container } from "react-bootstrap";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import styles from "./NPSCalculator.module.css";

const NPSCalculator = () => {
    const [npsData, setNpsData] = useState({
        monthlyInvestment: "",
        interestRate: "",
        currentAge: "",
        retirementAge: "60", // Default retirement age
    });

    const [npsResult, setNpsResult] = useState(null);

    const handleNpsChange = (e) => {
        setNpsData({
            ...npsData,
            [e.target.name]: e.target.value,
        });
    };

    const calculateNPS = (e) => {
        e.preventDefault();
        const principal = parseFloat(npsData.monthlyInvestment);
        const annualRate = parseFloat(npsData.interestRate) / 100;
        const currentAge = parseFloat(npsData.currentAge);
        const retirementAge = parseFloat(npsData.retirementAge);

        const yearsToInvest = retirementAge - currentAge;
        const months = yearsToInvest * 12;
        const monthlyRate = annualRate / 12;

        if (principal && annualRate && yearsToInvest > 0) {
            // SIP Formula for accumulation
            // FV = P * ((1+r)^n - 1) * (1+r) / r
            const totalCorpus = principal * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);

            const totalInvestment = principal * months;
            const interestEarned = totalCorpus - totalInvestment;

            // NPS Specifics: 60% Lump sum, 40% Annuity (Standard calculation)
            // Assuming 40% goes to annuity
            const lumpSumAmount = totalCorpus * 0.60;
            const annuityAmount = totalCorpus * 0.40;

            // Estimated Pension (assuming 6% return on annuity)
            const estimatedPension = (annuityAmount * 0.06) / 12;

            // Generate Yearly Data for Bar Chart (Corpus Growth)
            const yearlyData = [];
            for (let i = 1; i <= yearsToInvest; i++) {
                const monthsPassed = i * 12;
                // SIP Formula for FV at year i
                const currentCorpus = principal * ((Math.pow(1 + monthlyRate, monthsPassed) - 1) / monthlyRate) * (1 + monthlyRate);

                yearlyData.push({
                    name: `Year ${i}`,
                    value: Math.round(currentCorpus),
                    label: `Year ${i}`
                });
            }

            setNpsResult({
                totalInvestment,
                interestEarned,
                totalCorpus,
                lumpSumAmount,
                annuityAmount,
                estimatedPension,
                yearsToInvest,
                yearlyData
            });
        }
    };

    const resetCalculator = () => {
        setNpsData({
            monthlyInvestment: "",
            interestRate: "",
            currentAge: "",
            retirementAge: "60",
        });
        setNpsResult(null);
    };

    return (
        <div className={styles.container}>

            <h2 className={styles.sectionTitle}>NPS CALCULATOR</h2>

            <div className={styles.calcWrapper}>
                <Container fluid style={{ padding: 0 }}>
                    <Row className="justify-content-center">
                        {/* Form Side */}
                        <Col lg={5} md={6} className="mb-4">
                            <div className={styles.formBox}>
                                <h3 className={styles.boxTitle}>NPS Calculation</h3>
                                <p className={styles.boxSubtitle}>Plan your retirement with National Pension System</p>

                                <Form onSubmit={calculateNPS}>
                                    <div className={styles.fieldGroup}>
                                        <Form.Label className={styles.label}>Monthly Investment (₹)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="monthlyInvestment"
                                            value={npsData.monthlyInvestment}
                                            onChange={handleNpsChange}
                                            placeholder="Enter monthly contribution"
                                            className={styles.input}
                                        />
                                        <Form.Text className="text-muted" style={{ fontSize: '12px' }}>Amount you want to invest per month</Form.Text>
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <Form.Label className={styles.label}>Expected Interest Rate (%)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="interestRate"
                                            value={npsData.interestRate}
                                            onChange={handleNpsChange}
                                            placeholder="Enter expected return"
                                            className={styles.input}
                                        />
                                        <Form.Text className="text-muted" style={{ fontSize: '12px' }}>Expected annual return on investment</Form.Text>
                                    </div>

                                    <div className={styles.rowGroup}>
                                        <div style={{ flex: 1 }}>
                                            <Form.Label className={styles.label}>Current Age</Form.Label>
                                            <Form.Control
                                                type="number"
                                                name="currentAge"
                                                value={npsData.currentAge}
                                                onChange={handleNpsChange}
                                                placeholder="Age"
                                                className={styles.input}
                                            />
                                        </div>
                                        <div style={{ flex: 1, marginLeft: '10px' }}>
                                            <Form.Label className={styles.label}>Retirement Age</Form.Label>
                                            <Form.Control
                                                type="number"
                                                name="retirementAge"
                                                value={npsData.retirementAge}
                                                onChange={handleNpsChange}
                                                placeholder="60"
                                                className={styles.input}
                                                readOnly // Simplify by keeping it readOnly or allow edit if desired
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.btnRow}>
                                        <button type="submit" className={styles.calcBtn}>Calculate Corpus</button>
                                        <button type="button" className={styles.resetBtn} onClick={resetCalculator}>Reset</button>
                                    </div>
                                </Form>
                            </div>
                        </Col>

                        {/* Result Side */}
                        <Col lg={5} md={6} className="mb-4">
                            <div className={styles.infoBox}>
                                {npsResult ? (
                                    <div className={styles.resultContent}>
                                        <h3 className={styles.boxTitle}>Result</h3>
                                        <div className={styles.resultRow}>
                                            <span>Total Investment:</span>
                                            <strong>₹{(+npsResult.totalInvestment).toLocaleString()}</strong>
                                        </div>
                                        <div className={styles.resultRow}>
                                            <span>Total Maturity Corpus:</span>
                                            <strong>₹{Math.round(npsResult.totalCorpus).toLocaleString()}</strong>
                                        </div>
                                        <div className={styles.resultRow} style={{ borderBottom: 'none', paddingBottom: '5px' }}>
                                            <span>Lump Sum Amount (60%):</span>
                                            <strong>₹{Math.round(npsResult.lumpSumAmount).toLocaleString()}</strong>
                                        </div>
                                        <div className={styles.resultRow} style={{ paddingTop: '0' }}>
                                            <span className="text-muted" style={{ fontSize: '12px' }}>Tax-free withdrawal</span>
                                        </div>

                                        <div className={styles.resultRow} style={{ borderBottom: 'none', paddingBottom: '5px', marginTop: '10px' }}>
                                            <span>Annuity Amount (40%):</span>
                                            <strong>₹{Math.round(npsResult.annuityAmount).toLocaleString()}</strong>
                                        </div>
                                        <div className={`${styles.resultRow} ${styles.finalResult}`}>
                                            <span style={{ fontSize: '18px' }}>Est. Monthly Pension:</span>
                                            <strong>₹{Math.round(npsResult.estimatedPension).toLocaleString()}</strong>
                                        </div>
                                        <div className="text-center mt-2 text-muted" style={{ fontSize: '11px' }}>
                                            * Pension calculated assuming 6% annuity rate
                                        </div>

                                        {/* Charts Section */}
                                        <div style={{ marginTop: '30px' }}>
                                            <h5 style={{ textAlign: 'center', fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: '#182724' }}>
                                                Investment Analysis
                                            </h5>

                                            {/* Pie Chart */}
                                            <div style={{ width: '100%', height: '250px', marginBottom: '20px' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={[
                                                                { name: 'Invested', value: Math.round(npsResult.totalInvestment) },
                                                                { name: 'Interest', value: Math.round(npsResult.interestEarned) }
                                                            ]}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={60}
                                                            outerRadius={80}
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                        >
                                                            <Cell key="cell-0" fill="#182724" />
                                                            <Cell key="cell-1" fill="#14B8A6" />
                                                        </Pie>
                                                        <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                                                        <Legend verticalAlign="bottom" height={36} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>

                                            {/* Bar Chart - Yearly Growth */}
                                            <div style={{ width: '100%', height: '300px' }}>
                                                <h5 style={{ textAlign: 'center', fontSize: '14px', marginBottom: '10px', color: '#666' }}>
                                                    Yearly Corpus Growth
                                                </h5>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={npsResult.yearlyData}
                                                        margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
                                                        barCategoryGap="20%"
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#e0e0e0" />
                                                        <XAxis
                                                            dataKey="name"
                                                            tick={{ fontSize: 12, fill: '#666' }}
                                                            angle={-45}
                                                            textAnchor="end"
                                                            interval="preserveStartEnd"
                                                        />
                                                        <YAxis
                                                            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                                                            tick={{ fontSize: 12, fill: '#666' }}
                                                        />
                                                        <Tooltip
                                                            formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Corpus"]}
                                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                        />
                                                        <Legend verticalAlign="top" />
                                                        <Bar
                                                            dataKey="value"
                                                            name="Accumulated Corpus"
                                                            fill="#14B8A6"
                                                            radius={[6, 6, 0, 0]}
                                                        />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.placeholderContent}>
                                        <h4 className={styles.placeholderTitle}>Plan Your Retirement</h4>
                                        <p className={styles.placeholderText}>Calculate your NPS corpus and estimated monthly pension</p>

                                        <div className={styles.featuresList}>
                                            <div className={styles.featureItem}>
                                                <i className="fas fa-piggy-bank me-2"></i> Build Corpus
                                            </div>
                                            <div className={styles.featureItem}>
                                                <i className="fas fa-hand-holding-dollar me-2"></i> Tax Benefits
                                            </div>
                                            <div className={styles.featureItem}>
                                                <i className="fas fa-infinity me-2"></i> Lifetime Pension
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Container>
            </div>

            {/* About Section */}
            <div className={styles.aboutSection}>
                <Container>
                    <div className={styles.aboutHeader}>
                        <h3>About National Pension System (NPS)</h3>
                    </div>
                    <div className={styles.aboutContent}>
                        <p className="text-center mb-5" style={{ maxWidth: '800px', margin: '0 auto', color: '#333' }}>
                            NPS is a voluntary, long-term retirement savings scheme designed to enable systematic savings and provide retirement income to all Indian citizens.
                        </p>

                        <Row className="g-4">
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-user-shield"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Secure Retirement</h5>
                                        <p className={styles.articleDesc}>Build a substantial retirement corpus with market-linked returns.</p>
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-percent"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Tax Benefits</h5>
                                        <p className={styles.articleDesc}>Avail additional tax deduction of ₹50,000 under Section 80CCD(1B) over and above 80C.</p>
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-exchange-alt"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Flexibility & Portability</h5>
                                        <p className={styles.articleDesc}>Choose your own fund managers and investment options (Equity/Debt) + Account is portable.</p>
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-coins"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Low Cost</h5>
                                        <p className={styles.articleDesc}>NPS is considered the world's lowest cost pension scheme.</p>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </Container>
            </div>

        </div>
    );
};

export default NPSCalculator;
