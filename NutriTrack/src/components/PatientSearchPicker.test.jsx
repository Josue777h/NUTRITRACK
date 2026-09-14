import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PatientSearchPicker from './PatientSearchPicker';

const mockPatients = [
    {
        id: 1,
        name: 'Carlos Mendoza',
        documentId: '1020304050',
        clinicalCode: 'PAC-1001',
        email: 'carlos@example.com',
        phone: '3001234567'
    },
    {
        id: 2,
        name: 'María Gómez',
        document_id: '9876543210',
        clinical_code: 'PAC-1002',
        email: 'maria@example.com',
        phone: '3109876543'
    },
    {
        id: 3,
        name: 'Andrés López',
        docId: '5566778899',
        code: 'PAC-1003',
        email: 'andres@example.com'
    }
];

describe('PatientSearchPicker', () => {
    it('muestra el placeholder cuando no hay paciente seleccionado', () => {
        render(
            <PatientSearchPicker
                patients={mockPatients}
                selectedId=""
                placeholder="Seleccionar paciente de prueba..."
            />
        );
        expect(screen.getByText('Seleccionar paciente de prueba...')).toBeInTheDocument();
    });

    it('muestra los datos del paciente seleccionado en el trigger', () => {
        render(
            <PatientSearchPicker
                patients={mockPatients}
                selectedId="1"
            />
        );
        expect(screen.getByText('Carlos Mendoza')).toBeInTheDocument();
        expect(screen.getByText('PAC-1001')).toBeInTheDocument();
        expect(screen.getByText('CC: 1020304050')).toBeInTheDocument();
    });

    it('abre el menú de búsqueda al hacer clic en el trigger', () => {
        render(
            <PatientSearchPicker
                patients={mockPatients}
                selectedId="1"
            />
        );
        const trigger = screen.getByRole('button');
        fireEvent.click(trigger);

        expect(screen.getByPlaceholderText('Escribe nombre, cédula o código...')).toBeInTheDocument();
    });

    it('filtra pacientes por nombre, cédula o código clínico', () => {
        render(
            <PatientSearchPicker
                patients={mockPatients}
                selectedId=""
            />
        );
        // Abrir dropdown
        fireEvent.click(screen.getByRole('button'));

        const input = screen.getByPlaceholderText('Escribe nombre, cédula o código...');

        // Filtrar por cédula
        fireEvent.change(input, { target: { value: '9876543210' } });
        expect(screen.getByText('María Gómez')).toBeInTheDocument();
        expect(screen.queryByText('Carlos Mendoza')).not.toBeInTheDocument();

        // Filtrar por código clínico
        fireEvent.change(input, { target: { value: 'PAC-1003' } });
        expect(screen.getByText('Andrés López')).toBeInTheDocument();
        expect(screen.queryByText('María Gómez')).not.toBeInTheDocument();
    });

    it('ejecuta onSelect cuando se hace clic en un paciente de la lista', () => {
        const handleSelect = vi.fn();
        render(
            <PatientSearchPicker
                patients={mockPatients}
                selectedId=""
                onSelect={handleSelect}
            />
        );
        fireEvent.click(screen.getByRole('button'));

        const patientItem = screen.getByText('María Gómez');
        fireEvent.click(patientItem);

        expect(handleSelect).toHaveBeenCalledWith(2, mockPatients[1]);
    });

    it('muestra un mensaje cuando no hay coincidencias', () => {
        render(
            <PatientSearchPicker
                patients={mockPatients}
                selectedId=""
            />
        );
        fireEvent.click(screen.getByRole('button'));

        const input = screen.getByPlaceholderText('Escribe nombre, cédula o código...');
        fireEvent.change(input, { target: { value: 'Inexistente999' } });

        expect(screen.getByText(/No se encontró ningún paciente con/i)).toBeInTheDocument();
    });
});
