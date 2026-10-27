// Stream Analytics JavaScript UDF used by fail-udf-and-metadata.asaql.
// Function alias: normalizeReading. Output type: float.
function main(value) {
    if (value === null || value === undefined) {
        return null;
    }
    return Math.round(Number(value) * 10) / 10;
}
