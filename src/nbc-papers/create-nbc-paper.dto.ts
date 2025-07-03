export class CreateNbcPaperDto {
    companyName: string;
    dealName: string;
    transactionType: string;
    structuringLeads: string[];
    sponsors: string[];
    projectDetails: {
        location: string;
        debtNeed: string;
    };
    marketContext: string;
    dueDiligenceFlags: string[];

   
    // portfolioExposure: {
    //     current: string;
    //     totalLimit: string;
    // };
}