const mongoose = require('mongoose');
require('dotenv').config();
const PartnerProfile = require('./models/PartnerProfile');

const uri = process.env.MONGO_URI;

mongoose.connect(uri)
  .then(async () => {
    const partners = await PartnerProfile.find({ status: 'APPROVED' });
                                         
                                                                                        
        
                                                                                      
                                                                                     
                                                                                    
                                                                                   
                                                                                  
                                                                                 
                                                                                
                                                                               
                                                                             
                                                                            
                                                                           
                                                                          
                                                                         
                                                                        
                                                                       
                                                                      
    console.log('--- ALL APPROVED PARTNERS ---');
    partners.forEach(p => {
      console.log(`Name: ${p.name}`);
      console.log(`- ServiceCategory: ${p.serviceCategory}`);
      console.log(`- Skills: ${JSON.stringify(p.skills)}`);
      console.log(`- Online: ${p.isOnline}`);
      console.log(`- Status: ${p.workingStatus}`);
      console.log('---------------------------');
    });
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
