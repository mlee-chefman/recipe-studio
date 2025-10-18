import { useState, useCallback } from 'react';
import {
  Parameters,
  ValidationErrors,
  validateRJ40Parameter,
  validateCQ50Parameter,
  validateBothProbeTemps,
} from '@utils/helpers/cookingValidation';
import {
  calculateDefaultRemoveTemp,
  ensureRemoveTempValid,
} from '@utils/helpers/temperatureHelpers';

interface UseCookingParametersProps {
  isRJ40: boolean;
  isCQ50: boolean;
  selectedMethod: any;
  useProbe: boolean;
}

export const useCookingParameters = ({
  isRJ40,
  isCQ50,
  selectedMethod,
  useProbe,
}: UseCookingParametersProps) => {
  const [parameters, setParameters] = useState<Parameters>({});
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [manualTemp, setManualTemp] = useState<string>('');
  const [manualRemoveTemp, setManualRemoveTemp] = useState<string>('');
  const [showRemoveTemp, setShowRemoveTemp] = useState(false);

  /**
   * Validates a parameter and updates errors
   */
  const validateParameter = useCallback(
    (key: string, value: any): string | null => {
      if (isRJ40) {
        return validateRJ40Parameter(key, value, selectedMethod);
      } else if (isCQ50) {
        return validateCQ50Parameter(key, value, selectedMethod, useProbe, parameters);
      }
      return null;
    },
    [isRJ40, isCQ50, selectedMethod, useProbe, parameters]
  );

  /**
   * Updates a single parameter and validates it
   */
  const updateParameter = useCallback(
    (key: string, value: any) => {
      setParameters((prev) => ({ ...prev, [key]: value }));

      // Validate the parameter
      const error = validateParameter(key, value);
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        if (error) {
          newErrors[key] = error;
        } else {
          delete newErrors[key];
        }
        return newErrors;
      });
    },
    [validateParameter]
  );

  /**
   * Updates both probe temperatures and validates them together
   */
  const updateBothProbeTemps = useCallback((targetTemp: number, removeTemp: number) => {
    setParameters((prev) => ({
      ...prev,
      target_probe_temp: targetTemp,
      remove_probe_temp: removeTemp,
    }));

    const { targetError, removeError } = validateBothProbeTemps(targetTemp, removeTemp);

    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      if (targetError) {
        newErrors.target_probe_temp = targetError;
      } else {
        delete newErrors.target_probe_temp;
      }
      if (removeError) {
        newErrors.remove_probe_temp = removeError;
      } else {
        delete newErrors.remove_probe_temp;
      }
      return newErrors;
    });
  }, []);

  /**
   * Handles target temperature change
   */
  const handleTargetTempChange = useCallback(
    (text: string) => {
      if (text === '') {
        setParameters((prev) => ({
          ...prev,
          target_probe_temp: undefined,
          remove_probe_temp: undefined,
        }));
        setManualTemp('');
        setShowRemoveTemp(false);
        return;
      }
      const temp = parseInt(text);
      if (!isNaN(temp)) {
        // Only update remove temp if it's already shown and needs adjustment
        if (showRemoveTemp && parameters.remove_probe_temp) {
          const removeTemp = ensureRemoveTempValid(parameters.remove_probe_temp, temp);
          updateBothProbeTemps(temp, removeTemp);
          if (removeTemp !== parameters.remove_probe_temp) {
            setManualRemoveTemp(removeTemp.toString());
          }
        } else {
          updateParameter('target_probe_temp', temp);
        }
        setManualTemp(text);
      }
    },
    [showRemoveTemp, parameters.remove_probe_temp, updateBothProbeTemps, updateParameter]
  );

  /**
   * Handles remove temperature change
   */
  const handleRemoveTempChange = useCallback(
    (text: string) => {
      if (text === '') {
        updateParameter('remove_probe_temp', undefined);
        setManualRemoveTemp('');
        return;
      }
      const temp = parseInt(text);
      if (!isNaN(temp)) {
        updateParameter('remove_probe_temp', temp);
        setManualRemoveTemp(text);
      }
    },
    [updateParameter]
  );

  /**
   * Initializes remove temperature with default value
   */
  const handleInitializeRemoveTemp = useCallback(() => {
    if (parameters.target_probe_temp) {
      const defaultRemoveTemp = calculateDefaultRemoveTemp(parameters.target_probe_temp);
      updateParameter('remove_probe_temp', defaultRemoveTemp);
      setManualRemoveTemp(defaultRemoveTemp.toString());
      setShowRemoveTemp(true);
    }
  }, [parameters.target_probe_temp, updateParameter]);

  /**
   * Hides remove temperature field
   */
  const handleHideRemoveTemp = useCallback(() => {
    setShowRemoveTemp(false);
    updateParameter('remove_probe_temp', undefined);
    setManualRemoveTemp('');
  }, [updateParameter]);

  return {
    parameters,
    setParameters,
    validationErrors,
    setValidationErrors,
    manualTemp,
    setManualTemp,
    manualRemoveTemp,
    setManualRemoveTemp,
    showRemoveTemp,
    setShowRemoveTemp,
    updateParameter,
    updateBothProbeTemps,
    handleTargetTempChange,
    handleRemoveTempChange,
    handleInitializeRemoveTemp,
    handleHideRemoveTemp,
  };
};
