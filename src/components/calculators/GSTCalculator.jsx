import React, { useState } from "react";
import { Form, Row, Col, Container } from "react-bootstrap";
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import styles from "./GSTCalculator.module.css";

const GSTCalculator = () => {
    const [gstData, setGstData] = useState({
        amount: "",
        taxRate: "",
        type: "exclusive", // exclusive or inclusive
    });

    const [gstResult, setGstResult] = useState(null);

    const handleGstChange = (e) => {
        setGstData({
            ...gstData,
            [e.target.name]: e.target.value,
        });
    };

    const calculateGST = (e) => {
        e.preventDefault();
        const amount = parseFloat(gstData.amount);
        const rate = parseFloat(gstData.taxRate);

        if (amount && rate) {
            let gstAmount = 0;
            let totalAmount = 0;
            let netAmount = 0;

            if (gstData.type === "exclusive") {
                // GST Exclusive: Amount + GST
                gstAmount = (amount * rate) / 100;
                totalAmount = amount + gstAmount;
                netAmount = amount;
            } else {
                // GST Inclusive: Amount includes GST
                // Formula: GST = Total - (Total * (100 / (100 + Rate)))
                const preTaxAmount = amount * (100 / (100 + rate));
                gstAmount = amount - preTaxAmount;
                totalAmount = amount;
                netAmount = preTaxAmount;
            }

            setGstResult({
                netAmount,
                gstAmount,
                totalAmount,
                type: gstData.type
            });
        }
    };

    const resetCalculator = () => {
        setGstData({
            amount: "",
            taxRate: "",
            type: "exclusive",
        });
        setGstResult(null);
    };

    return (
        <div className={styles.container}>

            <h2 className={styles.sectionTitle}>GST CALCULATOR</h2>

            <div className={styles.calcWrapper}>
                <Container fluid style={{ padding: 0 }}>
                    <Row className="justify-content-center">
                        {/* Form Side */}
                        <Col lg={5} md={6} className="mb-4">
                            <div className={styles.formBox}>
                                <h3 className={styles.boxTitle}>GST Calculation</h3>
                                <p className={styles.boxSubtitle}>Calculate GST Exclusive or Inclusive amounts</p>

                                <Form onSubmit={calculateGST}>
                                    <div className={styles.fieldGroup}>
                                        <Form.Label className={styles.label}>Amount (₹)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            name="amount"
                                            value={gstData.amount}
                                            onChange={handleGstChange}
                                            placeholder="Enter amount"
                                            className={styles.input}
                                        />
                                        <Form.Text className="text-muted" style={{ fontSize: '12px' }}>Total amount</Form.Text>
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <Form.Label className={styles.label}>GST Rate (%)</Form.Label>
                                        <Form.Select
                                            name="taxRate"
                                            value={gstData.taxRate}
                                            onChange={handleGstChange}
                                            className={styles.input}
                                        >
                                            <option value="">Select Rate</option>
                                            <option value="3">3%</option>
                                            <option value="5">5%</option>
                                            <option value="12">12%</option>
                                            <option value="18">18%</option>
                                            <option value="28">28%</option>
                                        </Form.Select>
                                        <Form.Text className="text-muted" style={{ fontSize: '12px' }}>Standard GST slab rates</Form.Text>
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <Form.Label className={styles.label}>Calculation Type</Form.Label>
                                        <div className="d-flex align-items-center mt-2">
                                            <Form.Check
                                                type="radio"
                                                label="GST Exclusive"
                                                name="type"
                                                value="exclusive"
                                                checked={gstData.type === "exclusive"}
                                                onChange={handleGstChange}
                                                className="me-4"
                                                style={{ color: '#333', fontWeight: 500 }}
                                            />
                                            <Form.Check
                                                type="radio"
                                                label="GST Inclusive"
                                                name="type"
                                                value="inclusive"
                                                checked={gstData.type === "inclusive"}
                                                onChange={handleGstChange}
                                                style={{ color: '#333', fontWeight: 500 }}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.btnRow}>
                                        <button type="submit" className={styles.calcBtn}>Calculate GST</button>
                                        <button type="button" className={styles.resetBtn} onClick={resetCalculator}>Reset</button>
                                    </div>
                                </Form>
                            </div>
                        </Col>

                        {/* Result Side */}
                        <Col lg={5} md={6} className="mb-4">
                            <div className={styles.infoBox}>
                                {gstResult ? (
                                    <div className={styles.resultContent}>
                                        <h3 className={styles.boxTitle}>Result</h3>
                                        <div className={styles.resultRow}>
                                            <span>Net Amount (Pre-Tax):</span>
                                            <strong>₹{(+gstResult.netAmount).toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
                                        </div>
                                        <div className={styles.resultRow}>
                                            <span>GST Amount:</span>
                                            <strong>₹{Math.round(gstResult.gstAmount).toLocaleString()}</strong>
                                        </div>
                                        <div className={`${styles.resultRow} ${styles.finalResult}`}>
                                            <span>Total Amount:</span>
                                            <strong>₹{Math.round(gstResult.totalAmount).toLocaleString()}</strong>
                                        </div>

                                        {/* Charts Section */}
                                        <div style={{ marginTop: '30px' }}>
                                            <h5 style={{ textAlign: 'center', fontSize: '16px', fontWeight: '600', marginBottom: '20px', color: '#182724' }}>
                                                Tax Breakdown
                                            </h5>

                                            {/* Pie Chart */}
                                            <div style={{ width: '100%', height: '250px', marginBottom: '20px' }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={[
                                                                { name: 'Net Amount', value: Math.round(gstResult.netAmount) },
                                                                { name: 'GST Amount', value: Math.round(gstResult.gstAmount) }
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

                                            {/* Bar Chart - Comparative Analysis */}
                                            <div style={{ width: '100%', height: '300px' }}>
                                                <h5 style={{ textAlign: 'center', fontSize: '14px', marginBottom: '10px', color: '#666' }}>
                                                    Component Analysis
                                                </h5>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart
                                                        data={[
                                                            { name: 'Net', value: Math.round(gstResult.netAmount) },
                                                            { name: 'GST', value: Math.round(gstResult.gstAmount) },
                                                            { name: 'Total', value: Math.round(gstResult.totalAmount) }
                                                        ]}
                                                        margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
                                                        barCategoryGap="20%"
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#e0e0e0" />
                                                        <XAxis
                                                            dataKey="name"
                                                            tick={{ fontSize: 12, fill: '#666' }}
                                                        />
                                                        <YAxis
                                                            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                                                            tick={{ fontSize: 12, fill: '#666' }}
                                                        />
                                                        <Tooltip
                                                            formatter={(value) => [`₹${Number(value).toLocaleString()}`, "Amount"]}
                                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                        />

                                                        <Bar
                                                            dataKey="value"
                                                            name="Amount"
                                                            fill="#14B8A6"
                                                            radius={[6, 6, 0, 0]}
                                                        >
                                                            {
                                                                [
                                                                    { name: 'Net', value: Math.round(gstResult.netAmount) },
                                                                    { name: 'GST', value: Math.round(gstResult.gstAmount) },
                                                                    { name: 'Total', value: Math.round(gstResult.totalAmount) }
                                                                ].map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={index === 1 ? '#FF4D4F' : '#14B8A6'} />
                                                                ))
                                                            }
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.placeholderContent}>
                                        <h4 className={styles.placeholderTitle}>Enter GST Details</h4>
                                        <p className={styles.placeholderText}>Calculate tax amounts easily for your business billing</p>

                                        <div className={styles.featuresList}>
                                            <div className={styles.featureItem}>
                                                <i className="fas fa-file-invoice-dollar me-2"></i> Inclusive/Exclusive
                                            </div>
                                            <div className={styles.featureItem}>
                                                <i className="fas fa-percent me-2"></i> Standard Slabs
                                            </div>
                                            <div className={styles.featureItem}>
                                                <i className="fas fa-calculator me-2"></i> Precise Math
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
                        <h3>About Goods and Services Tax (GST)</h3>
                    </div>
                    <div className={styles.aboutContent}>
                        <p className="text-center mb-5" style={{ maxWidth: '800px', margin: '0 auto', color: '#333' }}>
                            GST is a destination-based tax on consumption of goods and services. It is levied at all stages right from manufacture up to final consumption with credit of taxes paid at previous stages available as setoff.
                        </p>

                        <Row className="g-4">
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-globe"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>One Nation, One Tax</h5>
                                        <p className={styles.articleDesc}>Replaces multiple indirect taxes like Excise, VAT, Service Tax, etc.</p>
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-layer-group"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Tax Slabs</h5>
                                        <p className={styles.articleDesc}>Goods are categorized into 5%, 12%, 18%, and 28% tax slabs.</p>
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-file-invoice"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Simpler Invoice</h5>
                                        <p className={styles.articleDesc}>Simplifies the invoicing process with uniform tax rates across the country.</p>
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div className={styles.aboutCard}>
                                    <div className={styles.iconBox}><i className="fas fa-laptop-code"></i></div>
                                    <div className="ps-3">
                                        <h5 className={styles.articleTitle}>Online Procedure</h5>
                                        <p className={styles.articleDesc}>Everything from registration to return filing is done online.</p>
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

export default GSTCalculator;
