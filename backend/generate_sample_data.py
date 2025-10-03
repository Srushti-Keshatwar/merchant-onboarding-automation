# generate_sample_data.py
import json
import os
from faker import Faker
from faker.providers import company, person, address, phone_number, date_time, lorem
import random
from datetime import datetime, timedelta
import uuid

# Initialize Faker for different locales
fake_us = Faker('en_US')
fake_uk = Faker('en_GB') 
fake_ca = Faker('en_CA')

class MerchantDataGenerator:
    def __init__(self):
        self.industries = [
            'Food & Beverage', 'Retail', 'E-commerce', 'Professional Services',
            'Healthcare', 'Technology', 'Manufacturing', 'Entertainment',
            'Fashion', 'Electronics', 'Automotive', 'Education', 'Finance'
        ]
        
        self.business_types = ['LLC', 'Corporation', 'Partnership', 'Sole Proprietorship']
        
        self.risk_levels = ['Low', 'Medium', 'High']
        
        self.document_types = [
            'Business License', 'Articles of Incorporation', 'EIN Letter',
            'Tax Registration', 'Bank Statement', 'Driver License', 
            'Passport', 'Operating Agreement', 'Sales Tax Permit'
        ]

    def generate_merchant_profile(self, locale='US'):
        """Generate complete merchant profile with all required data"""
        
        if locale == 'US':
            fake = fake_us
            country = 'United States'
            state = fake.state_abbr()
        elif locale == 'UK':
            fake = fake_uk
            country = 'United Kingdom'
            state = 'England'
        else:
            fake = fake_us
            country = 'United States'
            state = fake.state_abbr()

        business_name = fake.company()
        owner_name = fake.name()
        
        # Generate realistic EIN/Tax ID
        if locale == 'US':
            ein = f"{random.randint(10,99)}-{random.randint(1000000,9999999)}"
            tax_id = ein
        else:
            tax_id = f"GB{random.randint(100000000,999999999)}"
            ein = None

        profile = {
            # Basic Business Info
            'business_name': business_name,
            'business_id': str(uuid.uuid4()),
            'business_type': random.choice(self.business_types),
            'industry': random.choice(self.industries),
            'founded_date': fake.date_between(start_date='-10y', end_date='-1y').isoformat(),
            
            # Owner/Contact Info
            'owner_name': owner_name,
            'owner_email': fake.email(),
            'owner_phone': fake.phone_number(),
            'owner_ssn': fake.ssn() if locale == 'US' else None,
            'owner_date_of_birth': fake.date_of_birth(minimum_age=25, maximum_age=70).isoformat(),
            
            # Business Address
            'business_address': {
                'street': fake.street_address(),
                'city': fake.city(),
                'state': state,
                'zip_code': fake.postcode(),
                'country': country
            },
            
            # Financial Info
            'ein': ein,
            'tax_id': tax_id,
            'monthly_processing_volume': random.randint(10000, 2000000),
            'annual_revenue': random.randint(100000, 10000000),
            'bank_account': {
                'bank_name': fake.company() + ' Bank',
                'account_number': fake.random_number(digits=10),
                'routing_number': fake.random_number(digits=9) if locale == 'US' else None,
                'sort_code': f"{random.randint(10,99)}-{random.randint(10,99)}-{random.randint(10,99)}" if locale == 'UK' else None
            },
            
            # Risk Assessment
            'risk_level': random.choice(self.risk_levels),
            'industry_risk_score': random.randint(1, 10),
            'pep_status': random.choice([False, False, False, True]),  # 25% chance
            'sanctions_match': False,  # Always false for demo
            
            # Processing Details
            'average_transaction': random.randint(25, 500),
            'card_present_percentage': random.randint(20, 100),
            'international_transactions': random.choice([True, False]),
            
            # Compliance
            'kyc_status': 'Pending',
            'aml_status': 'Pending',
            'document_verification_status': 'Pending',
            
            # Metadata
            'created_at': datetime.now().isoformat(),
            'locale': locale,
            'application_id': f"APP-{random.randint(100000,999999)}"
        }
        
        return profile

    def generate_document_metadata(self, merchant_profile):
        """Generate metadata for documents that would be uploaded"""
        
        documents = []
        
        # Business License
        documents.append({
            'document_type': 'Business License',
            'document_id': str(uuid.uuid4()),
            'file_name': f"business_license_{merchant_profile['business_name'].replace(' ', '_').lower()}.pdf",
            'license_number': f"{merchant_profile['business_address']['state']}-{random.randint(100000,999999)}",
            'issue_date': fake_us.date_between(start_date='-2y', end_date='-1y').isoformat(),
            'expiration_date': fake_us.date_between(start_date='today', end_date='+3y').isoformat(),
            'issuing_authority': f"{merchant_profile['business_address']['state']} Department of Commerce",
            'verification_status': 'Pending'
        })
        
        # EIN Letter
        if merchant_profile['ein']:
            documents.append({
                'document_type': 'EIN Letter',
                'document_id': str(uuid.uuid4()),
                'file_name': f"ein_letter_{merchant_profile['ein'].replace('-', '')}.pdf",
                'ein': merchant_profile['ein'],
                'issue_date': fake_us.date_between(start_date='-1y', end_date='today').isoformat(),
                'irs_reference': f"IRS-{random.randint(100000,999999)}",
                'verification_status': 'Pending'
            })
        
        # Driver's License
        documents.append({
            'document_type': 'Driver License',
            'document_id': str(uuid.uuid4()),
            'file_name': f"drivers_license_{merchant_profile['owner_name'].replace(' ', '_').lower()}.jpg",
            'license_number': f"{merchant_profile['business_address']['state']}{random.randint(10000000,99999999)}",
            'issue_date': fake_us.date_between(start_date='-5y', end_date='-1y').isoformat(),
            'expiration_date': fake_us.date_between(start_date='today', end_date='+5y').isoformat(),
            'state': merchant_profile['business_address']['state'],
            'verification_status': 'Pending'
        })
        
        # Bank Statements (3 months)
        for i in range(3):
            month_date = datetime.now() - timedelta(days=30*(i+1))
            documents.append({
                'document_type': 'Bank Statement',
                'document_id': str(uuid.uuid4()),
                'file_name': f"bank_statement_{month_date.strftime('%Y_%m')}.pdf",
                'statement_date': month_date.isoformat(),
                'bank_name': merchant_profile['bank_account']['bank_name'],
                'account_number': merchant_profile['bank_account']['account_number'],
                'beginning_balance': random.randint(10000, 100000),
                'ending_balance': random.randint(10000, 100000),
                'verification_status': 'Pending'
            })
        
        # Articles of Incorporation (for corporations)
        if merchant_profile['business_type'] == 'Corporation':
            documents.append({
                'document_type': 'Articles of Incorporation',
                'document_id': str(uuid.uuid4()),
                'file_name': f"articles_of_incorporation_{merchant_profile['business_name'].replace(' ', '_').lower()}.pdf",
                'incorporation_date': merchant_profile['founded_date'],
                'state_of_incorporation': merchant_profile['business_address']['state'],
                'file_number': f"C{random.randint(1000000,9999999)}",
                'verification_status': 'Pending'
            })
        
        return documents

    def generate_transaction_history(self, merchant_profile, months=6):
        """Generate realistic transaction history"""
        
        transactions = []
        base_volume = merchant_profile['monthly_processing_volume']
        
        for month in range(months):
            month_date = datetime.now() - timedelta(days=30*month)
            daily_transactions = random.randint(50, 200)
            
            for day in range(28):  # 28 days per month for simplicity
                transaction_date = month_date - timedelta(days=day)
                
                for _ in range(random.randint(1, daily_transactions//28)):
                    transactions.append({
                        'transaction_id': str(uuid.uuid4()),
                        'date': transaction_date.isoformat(),
                        'amount': round(random.uniform(10, merchant_profile['average_transaction'] * 2), 2),
                        'currency': 'USD' if merchant_profile['locale'] == 'US' else 'GBP',
                        'payment_method': random.choice(['Credit Card', 'Debit Card', 'ACH', 'Wire Transfer']),
                        'status': random.choice(['Completed', 'Completed', 'Completed', 'Pending', 'Failed']),
                        'card_present': random.choice([True, False]),
                        'international': merchant_profile['international_transactions'] and random.choice([True, False, False])
                    })
        
        return transactions

def create_complete_sample_data():
    """Create complete sample data set for POC"""
    
    generator = MerchantDataGenerator()
    
    # Define our demo merchants
    demo_merchants = [
        {'name': 'sunny-side-bakery', 'locale': 'US', 'risk': 'Low'},
        {'name': 'techgadgets-direct', 'locale': 'US', 'risk': 'Medium'},
        {'name': 'cryptoconsult-services', 'locale': 'US', 'risk': 'High'},
        {'name': 'london-fashion-hub', 'locale': 'UK', 'risk': 'Medium'},
        {'name': 'quickbite-franchise', 'locale': 'US', 'risk': 'Low'}
    ]
    
    # Create sample-data directory
    os.makedirs('sample-data/merchants', exist_ok=True)
    
    all_data = {}
    
    for merchant_config in demo_merchants:
        print(f"Generating data for {merchant_config['name']}...")
        
        # Generate merchant profile
        profile = generator.generate_merchant_profile(merchant_config['locale'])
        profile['risk_level'] = merchant_config['risk']  # Override risk level
        
        # Generate documents
        documents = generator.generate_document_metadata(profile)
        
        # Generate transaction history
        transactions = generator.generate_transaction_history(profile)
        
        # Create merchant directory
        merchant_dir = f"sample-data/merchants/{merchant_config['name']}"
        os.makedirs(merchant_dir, exist_ok=True)
        
        # Save all data
        complete_data = {
            'profile': profile,
            'documents': documents,
            'transactions': transactions[-100:],  # Last 100 transactions for demo
            'summary': {
                'total_documents': len(documents),
                'total_transactions': len(transactions),
                'last_6_months_volume': sum([t['amount'] for t in transactions]),
                'risk_indicators': {
                    'high_value_transactions': len([t for t in transactions if t['amount'] > 1000]),
                    'international_transactions': len([t for t in transactions if t.get('international', False)]),
                    'failed_transactions': len([t for t in transactions if t['status'] == 'Failed'])
                }
            }
        }
        
        # Save to JSON
        with open(f"{merchant_dir}/complete_merchant_data.json", 'w') as f:
            json.dump(complete_data, f, indent=2)
        
        # Save individual files for easier access
        with open(f"{merchant_dir}/merchant_profile.json", 'w') as f:
            json.dump(profile, f, indent=2)
        
        with open(f"{merchant_dir}/documents.json", 'w') as f:
            json.dump(documents, f, indent=2)
        
        all_data[merchant_config['name']] = complete_data
        print(f"✅ Created complete data for {profile['business_name']}")
    
    # Create summary file
    with open('sample-data/all_merchants_summary.json', 'w') as f:
        summary = {
            'total_merchants': len(demo_merchants),
            'merchants': {name: data['profile']['business_name'] for name, data in all_data.items()},
            'risk_distribution': {
                'Low': len([d for d in all_data.values() if d['profile']['risk_level'] == 'Low']),
                'Medium': len([d for d in all_data.values() if d['profile']['risk_level'] == 'Medium']),
                'High': len([d for d in all_data.values() if d['profile']['risk_level'] == 'High'])
            },
            'generated_at': datetime.now().isoformat()
        }
        json.dump(summary, f, indent=2)
    
    print(f"\n🎉 Sample data generation complete!")
    print(f"📁 Check the 'sample-data/merchants/' directory")
    print(f"📊 {len(demo_merchants)} merchants with complete profiles, documents, and transaction history")
    
    return all_data

if __name__ == "__main__":
    create_complete_sample_data()