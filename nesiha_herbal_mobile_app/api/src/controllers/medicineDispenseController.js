import * as medicineDispenseService from "../services/medicineDispenseService.js";
import { SUCCESS_MESSAGES } from "../config/constants.js";
import logger from "../config/logger.js";

/**
 * Create medicine dispense record
 */
export const createDispense = async (req, res, next) => {
  try {
    const dispense = await medicineDispenseService.createDispense(
      req.body,
      req.user.id,
    );

    logger.info("Medicine dispensed", {
      dispenseId: dispense.id,
      userId: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Medicine dispensed successfully",
      data: dispense,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all dispense records
 */
export const getAllDispenses = async (req, res, next) => {
  try {
    const result = await medicineDispenseService.getAllDispenses(req.query);

    res.json({
      success: true,
      data: result.dispenses,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get dispense by ID
 */
export const getDispenseById = async (req, res, next) => {
  try {
    const dispense = await medicineDispenseService.getDispenseById(
      req.params.id,
    );

    res.json({
      success: true,
      data: dispense,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get dispenses by patient
 */
export const getDispensesByPatient = async (req, res, next) => {
  try {
    const dispenses = await medicineDispenseService.getDispensesByPatient(
      req.params.patientId,
      req.query,
    );

    res.json({
      success: true,
      data: dispenses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get dispenses by prescription
 */
export const getDispensesByPrescription = async (req, res, next) => {
  try {
    const dispenses = await medicineDispenseService.getDispensesByPrescription(
      req.params.prescriptionId,
    );

    res.json({
      success: true,
      data: dispenses,
    });
  } catch (error) {
    next(error);
  }
};
