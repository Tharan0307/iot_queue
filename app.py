def collect_bank_details():
    """
    Simple function to collect basic bank details from user input.
    """
    name = input("Enter account holder's name: ")
    account_number = input("Enter account number: ")
    bank_name = input("Enter bank name: ")
    ifsc_code = input("Enter IFSC code: ")
    
    # Return collected details as a dictionary
    return {
        'name': name,
        'account_number': account_number,
        'bank_name': bank_name,
        'ifsc_code': ifsc_code
    }

# Example usage
if __name__ == "__main__":
    details = collect_bank_details()
    print("Collected Bank Details:")
    for key, value in details.items():
        print(f"{key}: {value}")