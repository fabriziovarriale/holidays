import LeaveRequestForm from '@/Components/LeaveRequestForm';
import Slideover from '@/Components/Slideover';

export default function CreateRequestSlideover({
    show,
    onClose,
    leaveTypes,
    employeeBalance,
    employeeBalanceForLeaveStore = null,
    leaveStoreYear,
    employees = [],
    employeesWithBalances = {},
    isAdmin = false,
    errors = {},
}) {
    return (
        <Slideover show={show} onClose={onClose} title="Nuova richiesta ferie">
            <LeaveRequestForm
                leaveTypes={leaveTypes}
                employeeBalance={employeeBalance}
                employeeBalanceForLeaveStore={employeeBalanceForLeaveStore}
                leaveStoreYear={leaveStoreYear}
                employees={employees}
                employeesWithBalances={employeesWithBalances}
                isAdmin={isAdmin}
                initialStartDate=""
                initialEndDate=""
                errors={errors}
                onSuccess={onClose}
            />
        </Slideover>
    );
}
